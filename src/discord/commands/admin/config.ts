import { createCommand } from "#base";
import { getOrCreateBotConfig } from "#functions";
import { ApplicationCommandType, PermissionFlagsBits } from "discord.js";
import { renderConfigPanel } from "../../menus/config-panel.js";

createCommand({
    name: "config",
    description: "Abre o painel de configuracoes do bot.",
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.ManageGuild,
    async run(interaction) {
        if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
            await interaction.reply({
                flags: ["Ephemeral"],
                content: "Voce nao tem permissao para configurar o bot.",
            });
            return;
        }

        const config = await getOrCreateBotConfig(interaction.guildId);

        await interaction.reply(renderConfigPanel("production", config, undefined, interaction.guild));
    },
});
