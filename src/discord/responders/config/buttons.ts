import { createResponder } from "#base";
import { getOrCreateBotConfig, updateBotConfig } from "#functions";
import { ResponderType } from "@constatic/base";
import { createContainer } from "@magicyan/discord";
import { PermissionFlagsBits } from "discord.js";
import { createConfigEditModal, getVisibleConfigPanelPage, isConfigPanelPage, isConfigPanelSection, isProductionType, renderConfigPanel, type ConfigPanelPage, type ConfigPanelSection, type ProductionType } from "../../menus/config-panel.js";

createResponder({
    customId: "config/page/:page",
    types: [ResponderType.Button],
    cache: "cached",
    parse: params => ({
        page: parsePage(params.page),
    }),
    async run(interaction, { page }) {
        if (!canManageGuild(interaction.memberPermissions)) {
            await replyPermissionError(interaction);
            return;
        }

        const config = await getOrCreateBotConfig(interaction.guildId);

        await interaction.update(renderConfigPanel(page, config));
    },
});

createResponder({
    customId: "config/edit/:page",
    types: [ResponderType.Button],
    cache: "cached",
    parse: params => ({
        page: parsePage(params.page),
    }),
    async run(interaction, { page }) {
        if (!canManageGuild(interaction.memberPermissions)) {
            await replyPermissionError(interaction);
            return;
        }

        const config = await getOrCreateBotConfig(interaction.guildId);
        const visiblePage = getVisibleConfigPanelPage(page, config);
        if (visiblePage !== page || visiblePage === "production") {
            await interaction.update(renderConfigPanel(visiblePage, config));
            return;
        }

        await interaction.showModal(createConfigEditModal(visiblePage, "default", config));
    },
});

createResponder({
    customId: "config/edit/:page/:section",
    types: [ResponderType.Button],
    cache: "cached",
    parse: params => ({
        page: parsePage(params.page),
        section: parseSection(params.section),
    }),
    async run(interaction, { page, section }) {
        if (!canManageGuild(interaction.memberPermissions)) {
            await replyPermissionError(interaction);
            return;
        }

        const config = await getOrCreateBotConfig(interaction.guildId);
        const visiblePage = getVisibleConfigPanelPage(page, config);
        if (visiblePage !== page || visiblePage === "production") {
            await interaction.update(renderConfigPanel(visiblePage, config));
            return;
        }

        await interaction.showModal(createConfigEditModal(visiblePage, section, config));
    },
});

createResponder({
    customId: "config/close",
    types: [ResponderType.Button],
    cache: "cached",
    async run(interaction) {
        if (!canManageGuild(interaction.memberPermissions)) {
            await replyPermissionError(interaction);
            return;
        }

        await interaction.update({
            components: [createContainer("Grey", "Painel fechado.")],
        });
    },
});

createResponder({
    customId: "config/toggle-production/:type",
    types: [ResponderType.Button],
    cache: "cached",
    parse: params => ({
        type: parseProductionType(params.type),
    }),
    async run(interaction, { type }) {
        if (!canManageGuild(interaction.memberPermissions)) {
            await replyPermissionError(interaction);
            return;
        }

        const currentConfig = await getOrCreateBotConfig(interaction.guildId);
        const currentPhotoLaminated = currentConfig.photoLaminatedProductionEnabled ?? true;
        const currentFoilCard = currentConfig.foilCardProductionEnabled ?? true;
        const nextPhotoLaminated = type === "photo-laminated"
            ? !currentPhotoLaminated
            : currentPhotoLaminated;
        const nextFoilCard = type === "foil-card"
            ? !currentFoilCard
            : currentFoilCard;

        if (!nextPhotoLaminated && !nextFoilCard) {
            await interaction.update(renderConfigPanel(
                "production",
                currentConfig,
                "Pelo menos um tipo de confeccao deve permanecer habilitado.",
            ));
            return;
        }

        const config = await updateBotConfig(interaction.guildId, {
            photoLaminatedProductionEnabled: nextPhotoLaminated,
            foilCardProductionEnabled: nextFoilCard,
        });

        await interaction.update(renderConfigPanel("production", config, "Tipo de confeccao atualizado."));
    },
});

function parsePage(page: string): ConfigPanelPage {
    return isConfigPanelPage(page) ? page : "production";
}

function parseSection(section: string): ConfigPanelSection {
    return isConfigPanelSection(section) ? section : "default";
}

function parseProductionType(type: string): ProductionType {
    return isProductionType(type) ? type : "photo-laminated";
}

function canManageGuild(permissions: { has(permission: bigint): boolean }) {
    return permissions.has(PermissionFlagsBits.ManageGuild);
}

async function replyPermissionError(interaction: { reply(options: { flags: ["Ephemeral"]; content: string }): Promise<unknown> }) {
    await interaction.reply({
        flags: ["Ephemeral"],
        content: "Voce nao tem permissao para configurar o bot.",
    });
}
