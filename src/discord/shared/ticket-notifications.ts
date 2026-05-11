import { prisma } from "#database";
import { formatCurrencyFromCents, formatTicketOrderCardType, type CardOrderPrice, type TicketOrderCardTypeInput } from "#functions";
import { createContainer, Separator } from "@magicyan/discord";
import { ChannelType, type Client, type TextChannel } from "discord.js";

type TicketNotificationDetails = {
    cardType: TicketOrderCardTypeInput;
    cardCount: number;
    deckLink: string | null;
};

export async function sendNewTicketNotification(data: {
    client: Client;
    guildId: string;
    channelId: string;
    userId: string;
}) {
    const targetChannel = await getNotificationChannel(data.client, data.guildId);
    if (!targetChannel) return;

    const config = await prisma.guildBotConfig.findUnique({ where: { guildId: data.guildId } });
    const roleMentions = config?.notificationRoleIds.map(roleId => `<@&${roleId}>`).join(" ") ?? "";

    const container = createContainer("Blue",
        "# Novo ticket criado",
        Separator.Default,
        [
            `**Cliente:** <@${data.userId}>`,
            `**Canal:** <#${data.channelId}>`,
        ].join("\n"),
    );

    await targetChannel.send({
        content: roleMentions || undefined,
        flags: ["IsComponentsV2"],
        components: [container],
        allowedMentions: { roles: config?.notificationRoleIds ?? [] },
    }).catch(error => {
        console.error(`Failed to send new ticket notification for ${data.channelId}:`, error);
    });
}

export async function sendOrderDetailsNotification(data: {
    client: Client;
    guildId: string;
    channelId: string;
    userId: string;
    responsibleAdminId: string | null;
    details: TicketNotificationDetails;
    price: CardOrderPrice;
}) {
    const targetChannel = await getNotificationChannel(data.client, data.guildId);
    if (!targetChannel) return;

    const container = createContainer("Yellow",
        "# Pedido preenchido",
        Separator.Default,
        [
            `**Cliente:** <@${data.userId}>`,
            `**Responsavel:** ${data.responsibleAdminId ? `<@${data.responsibleAdminId}>` : "Nao definido"}`,
            `**Canal:** <#${data.channelId}>`,
            `**Tipo de carta:** ${formatTicketOrderCardType(data.details.cardType)}`,
            `**Quantidade:** ${data.details.cardCount}`,
            `**Valor:** ${formatCurrencyFromCents(data.price.finalPriceCents)}`,
            `**Link do deck:** ${data.details.deckLink ?? "Nao informado"}`,
        ].join("\n"),
    );

    await targetChannel.send({
        content: data.responsibleAdminId ? `<@${data.responsibleAdminId}>` : undefined,
        flags: ["IsComponentsV2"],
        components: [container],
        allowedMentions: { users: data.responsibleAdminId ? [data.responsibleAdminId] : [] },
    }).catch(error => {
        console.error(`Failed to send order details notification for ${data.channelId}:`, error);
    });
}

export async function sendPaymentConfirmedNotification(data: {
    client: Client;
    guildId: string;
    channelId: string;
    userId: string;
    responsibleAdminId: string | null;
    finalPriceCents: number | null;
}) {
    const targetChannel = await getNotificationChannel(data.client, data.guildId);
    if (!targetChannel) return;

    const container = createContainer("Green",
        "# Pagamento confirmado",
        Separator.Default,
        [
            `**Cliente:** <@${data.userId}>`,
            `**Responsavel:** ${data.responsibleAdminId ? `<@${data.responsibleAdminId}>` : "Nao definido"}`,
            `**Canal:** <#${data.channelId}>`,
            `**Valor pago:** ${formatCurrencyFromCents(data.finalPriceCents)}`,
        ].join("\n"),
    );

    await targetChannel.send({
        content: data.responsibleAdminId ? `<@${data.responsibleAdminId}>` : undefined,
        flags: ["IsComponentsV2"],
        components: [container],
        allowedMentions: { users: data.responsibleAdminId ? [data.responsibleAdminId] : [] },
    }).catch(error => {
        console.error(`Failed to send payment confirmed notification for ${data.channelId}:`, error);
    });
}

async function getNotificationChannel(client: Client, guildId: string): Promise<TextChannel | null> {
    const config = await prisma.guildBotConfig.findUnique({ where: { guildId } });
    if (!config?.notificationChannelId) return null;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return null;

    const channel = await guild.channels.fetch(config.notificationChannelId).catch(() => null);
    if (!channel || channel.type !== ChannelType.GuildText) return null;

    return channel;
}
