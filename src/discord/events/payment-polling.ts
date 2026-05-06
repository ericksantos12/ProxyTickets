import { createEvent } from "#base";
import { prisma } from "#database";
import { formatTicketChannelName } from "#functions";
import { ChannelType, type Client, type TextChannel } from "discord.js";
import { cancelPayment, getPayment } from "../../lib/mercado-pago.js";
import { renderPixPaymentConfirmed } from "../menus/ticket-order.js";
import { ensureTicketOwnerPermissions } from "../shared/ticket-permissions.js";

const pollingIntervalMs = 30_000;
const concludedCleanupIntervalMs = 5 * 60_000;
const concludedRetentionMs = 24 * 60 * 60_000;
let isPolling = false;
let isCleaningConcludedOrders = false;

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getTicketChannel(order: { channelId: string; guildId: string }, client: Client) {
    const guild = client.guilds.cache.get(order.guildId);
    if (!guild) return;

    const channel = await guild.channels.fetch(order.channelId).catch(() => null);
    if (!channel || channel.type !== ChannelType.GuildText) return;

    return channel;
}

async function cleanupExpiredOrder(order: { channelId: string; guildId: string; paymentId: string | null }, client: Client, options?: { cancelMercadoPagoOrder?: boolean }) {
    if (options?.cancelMercadoPagoOrder !== false && order.paymentId) {
        await cancelPayment(order.paymentId).catch(() => null);
    }

    await prisma.ticketOrder.update({
        where: { channelId: order.channelId },
        data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
            paymentStatus: "expired",
        },
    });

    const channel = await getTicketChannel(order, client);
    if (!channel) return;

    await channel.send({ content: `O PIX expirou. Este canal sera fechado em 10 segundos.` }).catch(() => null);

    for (let remaining = 9; remaining > 0; remaining -= 1) {
        await sleep(1000);
    }

    await channel.delete("PIX expirado").catch(() => null);
}

async function approveOrder(order: { channelId: string; guildId: string; userId: string; responsibleAdminId: string | null; paymentMessageId: string | null; finalPriceCents: number | null }, client: Client, paymentStatus: string | undefined) {
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

async function pollPendingPayments(client: Client) {
    if (isPolling) return;
    isPolling = true;

    try {
        const pendingOrders = await prisma.ticketOrder.findMany({
            where: {
                status: "PENDING_PAYMENT",
                paymentId: { not: null },
            },
        });

        for (const order of pendingOrders) {
            try {
                if (order.paymentExpiresAt && order.paymentExpiresAt <= new Date()) {
                    await cleanupExpiredOrder(order, client);
                    continue;
                }

                if (!order.paymentId) continue;

                const payment = await getPayment(order.paymentId);
                if (isApprovedPaymentStatus(payment.status)) {
                    await approveOrder(order, client, payment.status);
                    continue;
                }

                if (isExpiredPaymentStatus(payment.status)) {
                    await cleanupExpiredOrder(order, client, { cancelMercadoPagoOrder: false });
                    continue;
                }

                await prisma.ticketOrder.update({
                    where: { channelId: order.channelId },
                    data: { paymentStatus: payment.status },
                });
            } catch (error) {
                console.error(`Failed to poll payment for ${order.channelId}:`, error);
            }
        }
    } finally {
        isPolling = false;
    }
}

async function cleanupConcludedOrders(client: Client) {
    if (isCleaningConcludedOrders) return;
    isCleaningConcludedOrders = true;

    try {
        const cutoff = new Date(Date.now() - concludedRetentionMs);
        const concludedOrders = await prisma.ticketOrder.findMany({
            where: {
                status: "CONCLUDED",
                concludedAt: { lte: cutoff },
            },
        });

        for (const order of concludedOrders) {
            try {
                const channel = await getTicketChannel(order, client);
                if (!channel) continue;

                await channel.send({ content: "Pedido concluido. Este canal sera removido automaticamente em 10 segundos." }).catch(() => null);
                await sleep(10_000);
                await channel.delete("Pedido concluido ha mais de 24 horas").catch(() => null);
            } catch (error) {
                console.error(`Failed to cleanup concluded order for ${order.channelId}:`, error);
            }
        }
    } finally {
        isCleaningConcludedOrders = false;
    }
}

createEvent({
    name: "payment-polling-loop",
    event: "clientReady",
    once: true,
    async run(client) {
        await pollPendingPayments(client);
        await cleanupConcludedOrders(client);
        setInterval(() => {
            void pollPendingPayments(client);
        }, pollingIntervalMs);
        setInterval(() => {
            void cleanupConcludedOrders(client);
        }, concludedCleanupIntervalMs);
    },
});

function isApprovedPaymentStatus(status: string | undefined) {
    return status === "processed";
}

function isExpiredPaymentStatus(status: string | undefined) {
    return status === "expired";
}
