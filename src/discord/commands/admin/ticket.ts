import { createCommand } from "#base";
import { createContainer, createSection, Separator } from "@magicyan/discord";
import { ApplicationCommandType, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from "discord.js";

createCommand({
    name: "ticket",
    description: "Envia o painel publico para criacao de tickets.",
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.ManageGuild,
    async run(interaction) {
        if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
            await interaction.reply({
                flags: ["Ephemeral"],
                content: "Voce nao tem permissao para criar o painel de tickets.",
            });
            return;
        }

        const panel = createContainer("Blue",
            "# Atendimento de proxies\nTire duvidas, envie sua lista de cartas e acompanhe seu pedido em um canal privado.",
            Separator.Default,
            createSection(
                [
                    "**Como funciona**",
                    "1. Clique em **Criar ticket**.",
                    "2. Informe o tipo de confeccao e os detalhes do pedido.",
                    "3. Aguarde o atendimento para fechar valores e pagamento.",
                ].join("\n"),
                new ButtonBuilder({
                    customId: "ticket/create",
                    label: "Criar ticket",
                    style: ButtonStyle.Success,
                }),
            ),
            Separator.Default,
            "Tenha em maos sua lista de cartas para agilizar o atendimento.",
        );

        await interaction.reply({
            flags: ["IsComponentsV2"],
            components: [panel],
        });
    },
});
