import { createCommand } from "#base";
import { prisma } from "#database";
import { ApplicationCommandType, ChannelType, PermissionFlagsBits } from "discord.js";

createCommand({
    name: "fechar",
    description: "Fecha e cancela um ticket imediatamente.",
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.ManageGuild,
    async run(interaction) {
        if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
            await interaction.reply({
                flags: ["Ephemeral"],
                content: "Voce nao tem permissao para fechar tickets.",
            });
            return;
        }

        if (!interaction.guildId) {
            await interaction.reply({
                flags: ["Ephemeral"],
                content: "Este comando so pode ser usado em servidores.",
            });
            return;
        }

        const targetChannel = interaction.channel;
        if (!targetChannel || targetChannel.type !== ChannelType.GuildText) {
            await interaction.reply({
                flags: ["Ephemeral"],
                content: "Informe um canal de texto com ticket.",
            });
            return;
        }

        const order = await prisma.ticketOrder.findUnique({
            where: { channelId: targetChannel.id },
        });
        if (!order) {
            await interaction.reply({
                flags: ["Ephemeral"],
                content: "Este canal nao possui ticket ativo.",
            });
            return;
        }
        if (order.status === "CANCELLED") {
            await interaction.reply({
                flags: ["Ephemeral"],
                content: "Este ticket ja foi cancelado.",
            });
            return;
        }

        await prisma.ticketOrder.update({
            where: { channelId: targetChannel.id },
            data: {
                status: "CANCELLED",
                cancelledAt: new Date(),
            },
        });

        await interaction.reply({
            flags: ["Ephemeral"],
            content: `Ticket cancelado. O canal ${targetChannel} sera apagado em 10 segundos.`,
        });

        for (let remaining = 9; remaining > 0; remaining -= 1) {
            await sleep(1000);
            await interaction.editReply({
                content: `Ticket cancelado. O canal ${targetChannel} sera apagado em ${remaining} segundos.`,
            }).catch(() => null);
        }

        try {
            await targetChannel.delete(`Ticket cancelado por ${interaction.user.tag}`);
        } catch (error) {
            await interaction.followUp({
                flags: ["Ephemeral"],
                content: "Ticket cancelado, mas nao consegui apagar o canal.",
            });
            throw error;
        }
    },
});

async function sleep(ms: number) {
    await new Promise(resolve => setTimeout(resolve, ms));
}
