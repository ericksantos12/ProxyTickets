import { createEvent } from "#base";
import { startWebhookServer } from "../../server/webhook.js";

createEvent({
    name: "start-mercado-pago-webhook",
    event: "clientReady",
    once: true,
    async run(client) {
        startWebhookServer(client);
    },
});
