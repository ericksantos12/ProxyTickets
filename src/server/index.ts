import fastify from "fastify";
import { prisma } from "#database";

export interface ServerConfig {
    token: string;
    host: string;
    port: number;
}

const VALID_STATUSES = [
    "NEW",
    "AWAITING_USER_DETAILS",
    "PENDING_CONFIRMATION",
    "IN_REVIEW",
    "PENDING_PAYMENT",
    "AWAITING_DELIVERY",
    "CONCLUDED",
    "CANCELLED",
] as const;

type ValidStatus = (typeof VALID_STATUSES)[number];

const orderFields = {
    oid: true,
    guildId: true,
    channelId: true,
    userId: true,
    responsibleAdminId: true,
    status: true,
    cardType: true,
    cardCount: true,
    deckLink: true,
    sheetCount: true,
    materialCostCents: true,
    profitMarginPercent: true,
    finalPriceCents: true,
    paymentMethod: true,
    paymentStatus: true,
    paymentExpiresAt: true,
    paidAt: true,
    cancelledAt: true,
    confirmedAt: true,
    concludedAt: true,
    createdAt: true,
    updatedAt: true,
} as const;

function serializeOrder(order: {
    oid: string;
    guildId: string;
    channelId: string;
    userId: string;
    responsibleAdminId: string | null;
    status: string;
    cardType: string | null;
    cardCount: number | null;
    deckLink: string | null;
    sheetCount: number | null;
    materialCostCents: number | null;
    profitMarginPercent: number | null;
    finalPriceCents: number | null;
    paymentMethod: string | null;
    paymentStatus: string | null;
    paymentExpiresAt: Date | null;
    paidAt: Date | null;
    cancelledAt: Date | null;
    confirmedAt: Date | null;
    concludedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}) {
    return {
        id: order.oid,
        oid: order.oid,
        guildId: order.guildId,
        channelId: order.channelId,
        userId: order.userId,
        responsibleAdminId: order.responsibleAdminId,
        status: order.status,
        cardType: order.cardType,
        cardCount: order.cardCount,
        deckLink: order.deckLink,
        sheetCount: order.sheetCount,
        materialCostCents: order.materialCostCents,
        profitMarginPercent: order.profitMarginPercent,
        finalPriceCents: order.finalPriceCents,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        paymentExpiresAt: order.paymentExpiresAt,
        paidAt: order.paidAt,
        cancelledAt: order.cancelledAt,
        confirmedAt: order.confirmedAt,
        concludedAt: order.concludedAt,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
    };
}

export async function startServer(config: ServerConfig) {
    const app = fastify({ logger: false });

    app.addHook("onRequest", async (request, reply) => {
        if (request.routeOptions.url === "/health") return;

        const auth = request.headers.authorization;
        if (!auth || !auth.startsWith("Bearer ")) {
            reply.code(401).send({ error: "Unauthorized" });
            return;
        }

        const token = auth.slice(7);
        if (token !== config.token) {
            reply.code(401).send({ error: "Unauthorized" });
            return;
        }
    });

    app.get("/health", async () => ({ status: "ok" }));

    app.get("/orders/in-progress", async () => {
        const orders = await prisma.ticketOrder.findMany({
            where: {
                status: { notIn: ["CONCLUDED", "CANCELLED"] },
            },
            select: orderFields,
            orderBy: { createdAt: "desc" },
        });
        return { data: orders.map(serializeOrder) };
    });

    app.get("/orders/cancelled", async () => {
        const orders = await prisma.ticketOrder.findMany({
            where: { status: "CANCELLED" },
            select: orderFields,
            orderBy: { createdAt: "desc" },
        });
        return { data: orders.map(serializeOrder) };
    });

    app.get("/orders/concluded", async () => {
        const orders = await prisma.ticketOrder.findMany({
            where: { status: "CONCLUDED" },
            select: orderFields,
            orderBy: { createdAt: "desc" },
        });
        return { data: orders.map(serializeOrder) };
    });

    app.get("/orders", async (request, reply) => {
        const query = request.query as Record<string, unknown>;
        const status = query.status;

        if (status !== undefined && status !== null && status !== "") {
            if (typeof status !== "string" || !VALID_STATUSES.includes(status as ValidStatus)) {
                reply.code(400).send({ error: "Invalid status" });
                return;
            }

            const orders = await prisma.ticketOrder.findMany({
                where: { status: status as ValidStatus },
                select: orderFields,
                orderBy: { createdAt: "desc" },
            });
            return { data: orders.map(serializeOrder) };
        }

        const orders = await prisma.ticketOrder.findMany({
            select: orderFields,
            orderBy: { createdAt: "desc" },
        });
        return { data: orders.map(serializeOrder) };
    });

    await app.listen({ host: config.host, port: config.port });
}
