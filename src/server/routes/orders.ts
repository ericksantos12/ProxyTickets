import type { FastifyInstance } from "fastify";
import { listInProgressOrders, listOrders, listOrdersByStatus, VALID_STATUSES, type ValidStatus } from "../services/orders.js";

export function registerOrderRoutes(app: FastifyInstance) {
    app.get("/orders/in-progress", async () => ({ data: await listInProgressOrders() }));

    app.get("/orders/cancelled", async () => ({ data: await listOrdersByStatus("CANCELLED") }));

    app.get("/orders/concluded", async () => ({ data: await listOrdersByStatus("CONCLUDED") }));

    app.get("/orders", async (request, reply) => {
        const query = request.query as Record<string, unknown>;
        const status = query.status;

        if (status !== undefined && status !== null && status !== "") {
            if (typeof status !== "string" || !VALID_STATUSES.includes(status as ValidStatus)) {
                reply.code(400).send({ error: "Invalid status" });
                return;
            }

            return { data: await listOrdersByStatus(status as ValidStatus) };
        }

        return { data: await listOrders() };
    });
}
