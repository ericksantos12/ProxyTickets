import { prisma } from "#database";
import { replaceChannelStageEmoji } from "#functions";
import { ChannelType, type Client, type TextChannel } from "discord.js";
import { renderPixPaymentConfirmed } from "../menus/ticket-order.js";
import { ensureTicketOwnerPermissions } from "./ticket-permissions.js";
import { sendPaymentConfirmedNotification } from "./ticket-notifications.js";

export async function approveTicketOrderPayment(order: {
    channelId: string;
    guildId: string;
    userId: string;
    responsibleAdminId: string | null;
    paymentMessageId: string | null;
    finalPriceCents: number | null;
}, client: Client, paymentStatus: string | undefined) {
    const channel = await getTicketChannel(order, client);

    await prisma.ticketOrder.update({
        where: { channelId: order.channelId },
        data: {
            status: "AWAITING_DELIVERY",
            paymentStatus,
            paidAt: new Date(),
        },
    });

    await sendPaymentConfirmedNotification({
        client,
        guildId: order.guildId,
        channelId: order.channelId,
        userId: order.userId,
        responsibleAdminId: order.responsibleAdminId,
        finalPriceCents: order.finalPriceCents,
    }).catch(error => {
        console.error(`Failed to send payment confirmed notification for ${order.channelId}:`, error);
    });

    if (!channel) return;

    await moveToAwaitingDelivery(order, channel).catch(error => {
        console.error(`Failed to move paid ticket ${order.channelId} to awaiting delivery:`, error);
    });
    await editPaymentMessageAsConfirmed(order, channel).catch(error => {
        console.error(`Failed to edit payment message for ${order.channelId}:`, error);
    });
}

async function getTicketChannel(order: { channelId: string; guildId: string }, client: Client) {
    const guild = client.guilds.cache.get(order.guildId);
    if (!guild) return;

    const channel = await guild.channels.fetch(order.channelId).catch(() => null);
    if (!channel || channel.type !== ChannelType.GuildText) return;

    return channel;
}

async function editPaymentMessageAsConfirmed(order: { userId: string; responsibleAdminId: string | null; paymentMessageId: string | null; finalPriceCents: number | null }, channel: TextChannel) {
    if (!order.paymentMessageId) return;

    const message = await channel.messages.fetch(order.paymentMessageId).catch(() => null);
    if (!message) return;

    await message.edit({
        ...renderPixPaymentConfirmed(order.userId, order.responsibleAdminId, order.finalPriceCents),
        attachments: [],
    }).catch(() => null);
}

async function moveToAwaitingDelivery(order: { guildId: string; userId: string }, channel: TextChannel) {
    const config = await prisma.guildBotConfig.findUnique({
        where: { guildId: order.guildId },
    });

    if (config?.awaitingDeliveryCategoryId) {
        const category = await channel.guild.channels.fetch(config.awaitingDeliveryCategoryId).catch(() => null);
        if (category && category.type === ChannelType.GuildCategory) {
            await channel.setParent(category.id, { lockPermissions: false, reason: "Pagamento confirmado" });
        }
    }

    await ensureTicketOwnerPermissions(channel, order.userId, "Manter acesso ao confirmar pagamento");

    const nextChannelName = replaceChannelStageEmoji(channel.name, "awaiting");
    await channel.setName(nextChannelName, "Pagamento confirmado");
}
