import { env } from "#env";
import { bootstrap } from "@constatic/base";
import { startServer } from "#server";

const serverPromise = startServer({
    token: env.API_TOKEN,
    host: env.API_HOST,
    port: env.API_PORT,
});

serverPromise.catch((err) => {
    console.error("API server failed to start:", err);
    process.exit(1);
});

await bootstrap({ meta: import.meta, env });
