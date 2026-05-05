import express from "express";
import { createHmac } from "crypto";
import { env } from "#env";
import { prisma } from "#database";
import { ChannelType } from "discord.js";
import { ensureTicketOwnerPermissions } from "../discord/shared/ticket-permissions.js";
import type { Client } from "discord.js";

export function startWebhookServer(client: Client) {
    const app = express();
    app.use(express.json());

    app.post("/webhooks/mercado-pago", async (req, res) => {
        const signature = req.headers["x-signature"] as string | undefined;
        const requestId = req.headers["x-request-id"] as string | undefined;

        if (!signature || !requestId) {
            res.status(400).send("Missing headers");
            return;
        }

        const body = req.body;
        const dataId = body.data?.id;

        if (!isValidSignature(signature, requestId, dataId)) {
            res.status(401).send("Invalid signature");
            return;
        }

        if (body.type !== "payment" && body.topic !== "payment") {
            res.status(200).send("Ignored");
            return;
        }

        try {
            await handlePaymentNotification(String(dataId), client);
            res.status(200).send("OK");
        } catch (error) {
            console.error("Webhook error:", error);
            res.status(500).send("Error");
        }
    });

    const port = Number.parseInt(env.WEBHOOK_PORT, 10);
    const server = app.listen(port, () => {
        console.log(`Webhook server listening on port ${port}`);
    });

    return server;
}

function isValidSignature(signatureHeader: string, requestId: string, dataId: string | undefined): boolean {
    const parts = signatureHeader.split(",");
    let timestamp = "";
    let hash = "";

    for (const part of parts) {
        const [key, value] = part.trim().split("=");
        if (key === "ts") timestamp = value;
        if (key === "v1") hash = value;
    }

    if (!timestamp || !hash || !dataId) {
        return false;
    }

    const template = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
    const expected = createHmac("sha256", env.MP_WEBHOOK_SECRET).update(template).digest("hex");

    return expected === hash;
}

async function handlePaymentNotification(paymentId: string, client: Client) {
    const order = await prisma.ticketOrder.findFirst({
        where: { paymentId },
    });

    if (!order || order.status === "CANCELLED" || order.status === "AWAITING_DELIVERY") {
        return;
    }

    // Importar dinamicamente para evitar circular dependency
    const { getPayment } = await import("../lib/mercado-pago.js");
    const payment = await getPayment(paymentId);

    if (payment.status !== "approved") {
        await prisma.ticketOrder.update({
            where: { channelId: order.channelId },
            data: { paymentStatus: payment.status },
        });
        return;
    }

    const guild = client.guilds.cache.get(order.guildId);
    if (!guild) {
        console.error(`Guild not found: ${order.guildId}`);
        return;
    }

    const channel = await guild.channels.fetch(order.channelId).catch(() => null);
    if (!channel || channel.type !== ChannelType.GuildText) {
        console.error(`Channel not found: ${order.channelId}`);
        return;
    }

    const config = await prisma.guildBotConfig.findUnique({
        where: { guildId: order.guildId },
    });

    if (config?.awaitingDeliveryCategoryId) {
        const category = await guild.channels.fetch(config.awaitingDeliveryCategoryId).catch(() => null);
        if (category && category.type === ChannelType.GuildCategory) {
            await channel.setParent(category.id, { lockPermissions: false, reason: "Pagamento confirmado" });
        }
    }

    await ensureTicketOwnerPermissions(channel, order.userId, "Manter acesso ao confirmar pagamento");

    const user = await client.users.fetch(order.userId).catch(() => null);
    const { formatTicketChannelName } = await import("#functions");
    const nextChannelName = formatTicketChannelName("awaiting", user?.username ?? "usuario");
    await channel.setName(nextChannelName, "Pagamento confirmado");

    await prisma.ticketOrder.update({
        where: { channelId: order.channelId },
        data: {
            status: "AWAITING_DELIVERY",
            paymentStatus: payment.status,
            paidAt: new Date(),
        },
    });

    await channel.send({
        content: `Pagamento confirmado! <@${order.userId}> seu pedido agora esta em preparo.`,
    });
}
