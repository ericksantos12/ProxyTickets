import { createEvent } from "#base";
import { prisma } from "#database";
import { ChannelType, type Client } from "discord.js";
import { cancelPayment } from "../../lib/mercado-pago.js";

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function cleanupExpiredOrder(order: { channelId: string; guildId: string; paymentId: string | null; userId: string }, client: Client) {
    const guild = client.guilds.cache.get(order.guildId);
    if (!guild) return;

    const channel = await guild.channels.fetch(order.channelId).catch(() => null);
    if (!channel || channel.type !== ChannelType.GuildText) return;

    await channel.send({ content: `O PIX expirou. Este canal sera fechado em 10 segundos.` }).catch(() => null);

    for (let remaining = 9; remaining > 0; remaining -= 1) {
        await sleep(1000);
    }

    await channel.delete("PIX expirado").catch(() => null);
}

createEvent({
    name: "payment-cleanup-loop",
    event: "clientReady",
    once: true,
    async run(client) {
        setInterval(async () => {
            const expiredOrders = await prisma.ticketOrder.findMany({
                where: {
                    status: "PENDING_PAYMENT",
                    paymentExpiresAt: { lt: new Date() },
                },
            });

            for (const order of expiredOrders) {
                try {
                    if (order.paymentId) {
                        await cancelPayment(order.paymentId).catch(() => null);
                    }

                    await prisma.ticketOrder.update({
                        where: { channelId: order.channelId },
                        data: {
                            status: "CANCELLED",
                            cancelledAt: new Date(),
                        },
                    });

                    await cleanupExpiredOrder(order, client);
                } catch (error) {
                    console.error(`Failed to cleanup expired payment for ${order.channelId}:`, error);
                }
            }
        }, 60000);
    },
});
