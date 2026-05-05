import { createEvent } from "#base";
import { prisma } from "#database";
import { ChannelType } from "discord.js";
import { ensureTicketOwnerPermissions } from "../shared/ticket-permissions.js";

createEvent({
    name: "ticket-channel-update-owner-permissions",
    event: "channelUpdate",
    async run(previous, current) {
        if (current.type !== ChannelType.GuildText || previous.type !== ChannelType.GuildText) {
            return;
        }
        if (previous.parentId === current.parentId) {
            return;
        }

        const order = await prisma.ticketOrder.findUnique({
            where: { channelId: current.id },
        });
        if (!order) {
            return;
        }

        await ensureTicketOwnerPermissions(current, order.userId, "Manter acesso do usuario ao mover categoria");
    },
});
