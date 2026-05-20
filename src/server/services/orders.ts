import { prisma } from "#database";
import { orderFields, serializeOrder } from "../serializers/order.js";

export const VALID_STATUSES = [
    "NEW",
    "AWAITING_USER_DETAILS",
    "PENDING_CONFIRMATION",
    "IN_REVIEW",
    "PENDING_PAYMENT",
    "AWAITING_DELIVERY",
    "CONCLUDED",
    "CANCELLED",
] as const;

export type ValidStatus = (typeof VALID_STATUSES)[number];

export async function listOrders() {
    const orders = await prisma.ticketOrder.findMany({
        select: orderFields,
        orderBy: { createdAt: "desc" },
    });

    return orders.map(serializeOrder);
}

export async function listOrdersByStatus(status: ValidStatus) {
    const orders = await prisma.ticketOrder.findMany({
        where: { status },
        select: orderFields,
        orderBy: { createdAt: "desc" },
    });

    return orders.map(serializeOrder);
}

export async function listInProgressOrders() {
    const orders = await prisma.ticketOrder.findMany({
        where: {
            status: { notIn: ["CONCLUDED", "CANCELLED"] },
        },
        select: orderFields,
        orderBy: { createdAt: "desc" },
    });

    return orders.map(serializeOrder);
}
