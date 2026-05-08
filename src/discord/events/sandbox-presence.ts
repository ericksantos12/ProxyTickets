import { createEvent } from "#base";
import { env } from "#env";

createEvent({
    name: "sandbox-presence-status",
    event: "clientReady",
    once: true,
    async run(client) {
        if (!env.MP_SANDBOX) {
            return;
        }

        client.user.setActivity("Modo Sandbox");
    },
});
