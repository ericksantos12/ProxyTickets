import type { FastifyInstance } from "fastify";

export function registerAuth(app: FastifyInstance, expectedToken: string) {
    app.addHook("onRequest", async (request, reply) => {
        if (request.routeOptions.url === "/health") return;

        const auth = request.headers.authorization;
        if (!auth || !auth.startsWith("Bearer ")) {
            reply.code(401).send({ error: "Unauthorized" });
            return;
        }

        const token = auth.slice(7);
        if (token !== expectedToken) {
            reply.code(401).send({ error: "Unauthorized" });
        }
    });
}
