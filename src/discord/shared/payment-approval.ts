import { prisma } from "#database";
import { formatTicketChannelName } from "#functions";
import { ChannelType, type Client, type TextChannel } from "discord.js";
import { renderPixPaymentConfirmed } from "../menus/ticket-order.js";
import { ensureTicketOwnerPermissions } from "./ticket-permissions.js";

export async function approveTicketOrderPayment(order: {
    channelId: string;
    guildId: string;
    userId: string;
    responsibleAdminId: string | null;
    paymentMessageId: string | null;
    finalPriceCents: number | null;
}, client: Client, paymentStatus: string | undefined) {
    const channel = await getTicketChannel(order, client);
    if (!channel) {
        await prisma.ticketOrder.update({
            where: { channelId: order.channelId },
            data: {
                status: "AWAITING_DELIVERY",
                paymentStatus,
                paidAt: new Date(),
            },
        });
        return;
    }

    await prisma.ticketOrder.update({
        where: { channelId: order.channelId },
        data: {
            status: "AWAITING_DELIVERY",
            paymentStatus,
            paidAt: new Date(),
        },
    });

    await moveToAwaitingDelivery(order, channel, client);
    await editPaymentMessageAsConfirmed(order, channel);
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

async function moveToAwaitingDelivery(order: { guildId: string; userId: string }, channel: TextChannel, client: Client) {
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

    const user = await client.users.fetch(order.userId).catch(() => null);
    const nextChannelName = formatTicketChannelName("awaiting", user?.username ?? "usuario");
    await channel.setName(nextChannelName, "Pagamento confirmado");
}
