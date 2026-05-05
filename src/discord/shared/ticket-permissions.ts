import { PermissionFlagsBits, type TextChannel } from "discord.js";

const ticketOwnerPermissions = {
    ViewChannel: true,
    SendMessages: true,
    ReadMessageHistory: true,
} as const;

export function hasTicketOwnerPermissions(channel: TextChannel, userId: string) {
    const overwrite = channel.permissionOverwrites.cache.get(userId);
    if (!overwrite) {
        return false;
    }

    return overwrite.allow.has(PermissionFlagsBits.ViewChannel)
        && overwrite.allow.has(PermissionFlagsBits.SendMessages)
        && overwrite.allow.has(PermissionFlagsBits.ReadMessageHistory)
        && !overwrite.deny.has(PermissionFlagsBits.ViewChannel)
        && !overwrite.deny.has(PermissionFlagsBits.SendMessages)
        && !overwrite.deny.has(PermissionFlagsBits.ReadMessageHistory);
}

export async function ensureTicketOwnerPermissions(channel: TextChannel, userId: string, reason?: string) {
    if (hasTicketOwnerPermissions(channel, userId)) {
        return;
    }

    await channel.permissionOverwrites.edit(userId, ticketOwnerPermissions, { reason });
}
