import { createResponder } from "#base";
import { parseFallbackPixKey, parsePriceCents, parseProfitMarginPercent, parseSheetCount, updateBotConfig, type BotConfigUpdateData } from "#functions";
import { ResponderType } from "@constatic/base";
import { PermissionFlagsBits } from "discord.js";
import { isConfigPanelPage, isConfigPanelSection, renderConfigPanel, type ConfigPanelPage, type ConfigPanelSection } from "../../menus/config-panel.js";

createResponder({
    customId: "config/save/:page",
    types: [ResponderType.ModalComponent],
    cache: "cached",
    parse: params => ({
        page: parsePage(params.page),
    }),
    async run(interaction, { page }) {
        if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
            await interaction.reply({
                flags: ["Ephemeral"],
                content: "Voce nao tem permissao para configurar o bot.",
            });
            return;
        }

        const price = parsePriceCents(interaction.fields.getTextInputValue("packPrice"));
        if (!price.ok) {
            await interaction.reply({ flags: ["Ephemeral"], content: price.error });
            return;
        }

        const count = parseSheetCount(interaction.fields.getTextInputValue("sheetCount"));
        if (!count.ok) {
            await interaction.reply({ flags: ["Ephemeral"], content: count.error });
            return;
        }

        const config = await updateBotConfig(interaction.guildId, getUpdateData(page, "default", price.value, count.value));

        await interaction.update(renderConfigPanel(page, config, "Configuracao atualizada.", interaction.guild));
    },
});

createResponder({
    customId: "config/save/:page/:section",
    types: [ResponderType.ModalComponent],
    cache: "cached",
    parse: params => ({
        page: parsePage(params.page),
        section: parseSection(params.section),
    }),
    async run(interaction, { page, section }) {
        if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
            await interaction.reply({
                flags: ["Ephemeral"],
                content: "Voce nao tem permissao para configurar o bot.",
            });
            return;
        }

        const price = parsePriceCents(interaction.fields.getTextInputValue("packPrice"));
        if (!price.ok) {
            await interaction.reply({ flags: ["Ephemeral"], content: price.error });
            return;
        }

        const count = parseSheetCount(interaction.fields.getTextInputValue("sheetCount"));
        if (!count.ok) {
            await interaction.reply({ flags: ["Ephemeral"], content: count.error });
            return;
        }

        const config = await updateBotConfig(interaction.guildId, getUpdateData(page, section, price.value, count.value));

        await interaction.update(renderConfigPanel(page, config, "Configuracao atualizada.", interaction.guild));
    },
});

createResponder({
    customId: "config/save-profit-margin",
    types: [ResponderType.ModalComponent],
    cache: "cached",
    async run(interaction) {
        if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
            await interaction.reply({
                flags: ["Ephemeral"],
                content: "Voce nao tem permissao para configurar o bot.",
            });
            return;
        }

        const profitMargin = parseProfitMarginPercent(interaction.fields.getTextInputValue("profitMarginPercent"));
        if (!profitMargin.ok) {
            await interaction.reply({ flags: ["Ephemeral"], content: profitMargin.error });
            return;
        }

        const config = await updateBotConfig(interaction.guildId, {
            profitMarginPercent: profitMargin.value,
        });

        await interaction.update(renderConfigPanel("production", config, "Margem de lucro atualizada.", interaction.guild));
    },
});

createResponder({
    customId: "config/save-fallback-pix",
    types: [ResponderType.ModalComponent],
    cache: "cached",
    async run(interaction) {
        if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
            await interaction.reply({
                flags: ["Ephemeral"],
                content: "Voce nao tem permissao para configurar o bot.",
            });
            return;
        }

        const fallbackPixKey = parseFallbackPixKey(interaction.fields.getTextInputValue("fallbackPixKey"));
        if (!fallbackPixKey.ok) {
            await interaction.reply({ flags: ["Ephemeral"], content: fallbackPixKey.error });
            return;
        }

        const config = await updateBotConfig(interaction.guildId, {
            fallbackPixKey: fallbackPixKey.value,
        });

        await interaction.update(renderConfigPanel("payment", config, "Chave PIX manual atualizada.", interaction.guild));
    },
});

function parsePage(page: string): ConfigPanelPage {
    return isConfigPanelPage(page) ? page : "production";
}

function parseSection(section: string): ConfigPanelSection {
    return isConfigPanelSection(section) ? section : "default";
}

function getUpdateData(page: ConfigPanelPage, section: ConfigPanelSection, priceCents: number, sheetCount: number): BotConfigUpdateData {
    if (page === "paper" && section === "default") {
        return {
            paperPackPriceCents: priceCents,
            paperPackSheetCount: sheetCount,
        };
    }

    if (page === "paper" && section === "lamination") {
        return {
            laminationPackPriceCents: priceCents,
            laminationPackSheetCount: sheetCount,
        };
    }

    if (page === "foil" && section === "holographic-sticker") {
        return {
            holographicStickerPackPriceCents: priceCents,
            holographicStickerPackSheetCount: sheetCount,
        };
    }

    if (page === "foil" && section === "cardstock") {
        return {
            cardstockPackPriceCents: priceCents,
            cardstockPackSheetCount: sheetCount,
        };
    }

    return {};
}
