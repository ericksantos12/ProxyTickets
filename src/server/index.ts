import fastify from "fastify";
import { registerAuth } from "./auth.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerOrderRoutes } from "./routes/orders.js";

export interface ServerConfig {
    token: string;
    host: string;
    port: number;
}

export async function startServer(config: ServerConfig) {
    const app = fastify({ logger: false });

    registerAuth(app, config.token);
    registerHealthRoutes(app);
    registerOrderRoutes(app);

    await app.listen({ host: config.host, port: config.port });
}
