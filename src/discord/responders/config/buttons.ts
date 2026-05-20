import { createResponder } from "#base";
import { getOrCreateBotConfig, updateBotConfig } from "#functions";
import { ResponderType } from "@constatic/base";
import { createContainer } from "@magicyan/discord";
import { ChannelType, PermissionFlagsBits } from "discord.js";
import { createConfigEditModal, createConfigFallbackPixKeyModal, createConfigProfitMarginModal, getVisibleConfigPanelPage, isConfigPanelPage, isConfigPanelSection, isProductionType, isTicketCategoryType, renderConfigPanel, type ConfigPanelPage, type ConfigPanelSection, type ProductionType, type TicketCategoryType } from "../../menus/config-panel.js";

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

        await interaction.update(renderConfigPanel(page, config, undefined, interaction.guild));
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
            await interaction.update(renderConfigPanel(visiblePage, config, undefined, interaction.guild));
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
            await interaction.update(renderConfigPanel(visiblePage, config, undefined, interaction.guild));
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
    customId: "config/edit-profit-margin",
    types: [ResponderType.Button],
    cache: "cached",
    async run(interaction) {
        if (!canManageGuild(interaction.memberPermissions)) {
            await replyPermissionError(interaction);
            return;
        }

        const config = await getOrCreateBotConfig(interaction.guildId);

        await interaction.showModal(createConfigProfitMarginModal(config));
    },
});

createResponder({
    customId: "config/edit-fallback-pix",
    types: [ResponderType.Button],
    cache: "cached",
    async run(interaction) {
        if (!canManageGuild(interaction.memberPermissions)) {
            await replyPermissionError(interaction);
            return;
        }

        const config = await getOrCreateBotConfig(interaction.guildId);

        await interaction.showModal(createConfigFallbackPixKeyModal(config));
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
                interaction.guild,
            ));
            return;
        }

        const config = await updateBotConfig(interaction.guildId, {
            photoLaminatedProductionEnabled: nextPhotoLaminated,
            foilCardProductionEnabled: nextFoilCard,
        });

        await interaction.update(renderConfigPanel("production", config, "Tipo de confeccao atualizado.", interaction.guild));
    },
});

createResponder({
    customId: "config/ticket-category/:type",
    types: [ResponderType.ChannelSelect],
    cache: "cached",
    parse: params => ({
        type: parseTicketCategoryType(params.type),
    }),
    async run(interaction, { type }) {
        if (!canManageGuild(interaction.memberPermissions)) {
            await replyPermissionError(interaction);
            return;
        }

        const selectedCategoryId = interaction.values[0];
        if (!selectedCategoryId) {
            await interaction.update(renderConfigPanel("ticket-categories", await getOrCreateBotConfig(interaction.guildId), "Selecione uma categoria valida.", interaction.guild));
            return;
        }

        const currentConfig = await getOrCreateBotConfig(interaction.guildId);
        if (isDuplicateTicketCategory(currentConfig, type, selectedCategoryId)) {
            await interaction.update(renderConfigPanel(
                "ticket-categories",
                currentConfig,
                "Cada etapa precisa usar uma categoria diferente.",
                interaction.guild,
            ));
            return;
        }

        const config = await updateBotConfig(interaction.guildId, getTicketCategoryUpdateData(type, selectedCategoryId));

        await interaction.update(renderConfigPanel("ticket-categories", config, "Categoria de ticket atualizada.", interaction.guild));
    },
});

createResponder({
    customId: "config/notification-channel",
    types: [ResponderType.ChannelSelect],
    cache: "cached",
    async run(interaction) {
        if (!canManageGuild(interaction.memberPermissions)) {
            await replyPermissionError(interaction);
            return;
        }

        const selectedChannelId = interaction.values[0];
        if (!selectedChannelId) {
            await interaction.update(renderConfigPanel("notifications", await getOrCreateBotConfig(interaction.guildId), "Selecione um canal valido.", interaction.guild));
            return;
        }

        const channel = await interaction.guild.channels.fetch(selectedChannelId).catch(() => null);
        if (!channel || channel.type !== ChannelType.GuildText) {
            await interaction.update(renderConfigPanel("notifications", await getOrCreateBotConfig(interaction.guildId), "Selecione um canal de texto valido.", interaction.guild));
            return;
        }

        const config = await updateBotConfig(interaction.guildId, {
            notificationChannelId: selectedChannelId,
        });

        await interaction.update(renderConfigPanel("notifications", config, "Canal de notificacoes atualizado.", interaction.guild));
    },
});

createResponder({
    customId: "config/notification-roles",
    types: [ResponderType.RoleSelect],
    cache: "cached",
    async run(interaction) {
        if (!canManageGuild(interaction.memberPermissions)) {
            await replyPermissionError(interaction);
            return;
        }

        const config = await updateBotConfig(interaction.guildId, {
            notificationRoleIds: interaction.values,
        });

        await interaction.update(renderConfigPanel("notifications", config, "Cargos de notificacao atualizados.", interaction.guild));
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

function parseTicketCategoryType(type: string): TicketCategoryType {
    return isTicketCategoryType(type) ? type : "new";
}

function isDuplicateTicketCategory(
    config: {
        newTicketsCategoryId: string | null;
        pendingPaymentCategoryId: string | null;
        awaitingDeliveryCategoryId: string | null;
    },
    type: TicketCategoryType,
    selectedCategoryId: string,
) {
    const currentField = getTicketCategoryField(type);
    const categoryIds = {
        newTicketsCategoryId: config.newTicketsCategoryId,
        pendingPaymentCategoryId: config.pendingPaymentCategoryId,
        awaitingDeliveryCategoryId: config.awaitingDeliveryCategoryId,
    };

    return Object.entries(categoryIds).some(([field, categoryId]) => (
        field !== currentField && categoryId === selectedCategoryId
    ));
}

function getTicketCategoryUpdateData(type: TicketCategoryType, categoryId: string) {
    return {
        [getTicketCategoryField(type)]: categoryId,
    };
}

function getTicketCategoryField(type: TicketCategoryType) {
    if (type === "pending") {
        return "pendingPaymentCategoryId" as const;
    }
    if (type === "awaiting") {
        return "awaitingDeliveryCategoryId" as const;
    }

    return "newTicketsCategoryId" as const;
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
