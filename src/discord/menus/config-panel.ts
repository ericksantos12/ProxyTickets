import { calculateUnitPriceCents, formatCurrencyFromCents, formatPriceInput } from "#functions";
import { createContainer, createLabel, createModal, createRow, createSection, createTextInput, Separator } from "@magicyan/discord";
import { ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType, type Guild, type InteractionReplyOptions, TextInputStyle } from "discord.js";

export const configPanelPages = ["production", "ticket-categories", "paper", "foil"] as const;

export type ConfigPanelPage = typeof configPanelPages[number];

export type BotConfigView = {
    paperPackPriceCents: number | null;
    paperPackSheetCount: number | null;
    laminationPackPriceCents: number | null;
    laminationPackSheetCount: number | null;
    holographicStickerPackPriceCents: number | null;
    holographicStickerPackSheetCount: number | null;
    cardstockPackPriceCents: number | null;
    cardstockPackSheetCount: number | null;
    photoLaminatedProductionEnabled: boolean | null;
    foilCardProductionEnabled: boolean | null;
    profitMarginPercent: number | null;
    newTicketsCategoryId: string | null;
    pendingPaymentCategoryId: string | null;
    awaitingDeliveryCategoryId: string | null;
};

export const configPanelSections = ["default", "lamination", "holographic-sticker", "cardstock"] as const;
export const productionTypes = ["photo-laminated", "foil-card"] as const;
export const ticketCategoryTypes = ["new", "pending", "awaiting"] as const;

export type ConfigPanelSection = typeof configPanelSections[number];
export type ProductionType = typeof productionTypes[number];
export type TicketCategoryType = typeof ticketCategoryTypes[number];

type PageDefinition = {
    id: ConfigPanelPage;
    title: string;
    sections: SectionDefinition[];
};

type SectionDefinition = {
    id: ConfigPanelSection;
    title: string;
    priceField: keyof Pick<BotConfigView, "paperPackPriceCents" | "laminationPackPriceCents" | "holographicStickerPackPriceCents" | "cardstockPackPriceCents">;
    countField: keyof Pick<BotConfigView, "paperPackSheetCount" | "laminationPackSheetCount" | "holographicStickerPackSheetCount" | "cardstockPackSheetCount">;
};

export const pageDefinitions: Record<ConfigPanelPage, PageDefinition> = {
    paper: {
        id: "paper",
        title: "Papel fotografico plastificado",
        sections: [
            {
                id: "default",
                title: "Folhas de impressao",
                priceField: "paperPackPriceCents",
                countField: "paperPackSheetCount",
            },
            {
                id: "lamination",
                title: "Folhas de plastificacao",
                priceField: "laminationPackPriceCents",
                countField: "laminationPackSheetCount",
            },
        ],
    },
    foil: {
        id: "foil",
        title: "Cartas foil",
        sections: [
            {
                id: "holographic-sticker",
                title: "Papel adesivo holografico",
                priceField: "holographicStickerPackPriceCents",
                countField: "holographicStickerPackSheetCount",
            },
            {
                id: "cardstock",
                title: "Papel cartao",
                priceField: "cardstockPackPriceCents",
                countField: "cardstockPackSheetCount",
            },
        ],
    },
    production: {
        id: "production",
        title: "Tipos de confeccao",
        sections: [],
    },
    "ticket-categories": {
        id: "ticket-categories",
        title: "Categorias de tickets",
        sections: [],
    },
};

export function isConfigPanelPage(page: string): page is ConfigPanelPage {
    return configPanelPages.includes(page as ConfigPanelPage);
}

export function isConfigPanelSection(section: string): section is ConfigPanelSection {
    return configPanelSections.includes(section as ConfigPanelSection);
}

export function isProductionType(type: string): type is ProductionType {
    return productionTypes.includes(type as ProductionType);
}

export function isTicketCategoryType(type: string): type is TicketCategoryType {
    return ticketCategoryTypes.includes(type as TicketCategoryType);
}

export function renderConfigPanel<R = InteractionReplyOptions>(page: ConfigPanelPage, config: BotConfigView, notice?: string, guild?: Guild): R {
    const visiblePages = getVisibleConfigPanelPages(config);
    const visiblePage = getVisibleConfigPanelPage(page, config);
    const definition = pageDefinitions[visiblePage];
    const pageIndex = visiblePages.indexOf(visiblePage);
    const previousPage = visiblePages[pageIndex - 1];
    const nextPage = visiblePages[pageIndex + 1];
    const sections = visiblePage === "production"
        ? renderProductionTypeSections(config)
        : visiblePage === "ticket-categories"
            ? renderTicketCategorySections(config, guild)
            : definition.sections.map(section => renderMaterialSection(visiblePage, section, config));
    const combinedUnitPriceCents = visiblePage === "paper" || visiblePage === "foil"
        ? definition.sections.reduce<number | null>((total, section) => {
            const unitPriceCents = calculateUnitPriceCents(config[section.priceField], config[section.countField]);

            return total === null || unitPriceCents === null ? null : total + unitPriceCents;
        }, 0)
        : null;

    const container = createContainer("Blue",
        `# Configuracoes do bot\n${notice ? `**${notice}**\n` : ""}Pagina ${pageIndex + 1}/${visiblePages.length}: **${definition.title}**`,
        Separator.Default,
        ...sections,
        ...(visiblePage === "paper" || visiblePage === "foil" ? [Separator.Default, `**Custo unitario combinado:** ${formatCurrencyFromCents(combinedUnitPriceCents)}`] : []),
        Separator.Default,
        createRow(
            new ButtonBuilder({
                customId: previousPage ? `config/page/${previousPage}` : `config/page/${page}`,
                label: "Anterior",
                style: ButtonStyle.Secondary,
                disabled: !previousPage,
            }),
            new ButtonBuilder({
                customId: nextPage ? `config/page/${nextPage}` : `config/page/${page}`,
                label: "Proximo",
                style: ButtonStyle.Secondary,
                disabled: !nextPage,
            }),
            new ButtonBuilder({
                customId: "config/close",
                label: "Fechar",
                style: ButtonStyle.Danger,
            }),
        ),
    );

    return ({
        flags: ["Ephemeral", "IsComponentsV2"],
        components: [container],
    } satisfies InteractionReplyOptions) as R;
}

export function createConfigEditModal(page: ConfigPanelPage, sectionId: ConfigPanelSection, config: BotConfigView) {
    const visiblePage = getVisibleConfigPanelPage(page, config);
    const definition = pageDefinitions[visiblePage];
    const section = getSectionDefinition(visiblePage, sectionId);

    return createModal(
        section.id === "default" ? `config/save/${visiblePage}` : `config/save/${visiblePage}/${section.id}`,
        definition.title === section.title ? `Editar ${definition.title}` : `Editar ${section.title}`,
        createLabel({
            label: "Preco do pacote",
            description: "Digite apenas numeros. Exemplos: 25,90 ou 1234.56",
            component: createTextInput({
                customId: "packPrice",
                required: true,
                style: TextInputStyle.Short,
                placeholder: "25,90",
                value: formatPriceInput(config[section.priceField]),
            }),
        }),
        createLabel({
            label: "Quantidade de folhas no pacote",
            description: "Digite um numero inteiro maior ou igual a 1.",
            component: createTextInput({
                customId: "sheetCount",
                required: true,
                style: TextInputStyle.Short,
                placeholder: "100",
                value: config[section.countField]?.toString(),
            }),
        }),
    );
}

export function createConfigProfitMarginModal(config: BotConfigView) {
    return createModal(
        "config/save-profit-margin",
        "Editar margem de lucro",
        createLabel({
            label: "Margem de lucro (%)",
            description: "Digite um numero inteiro maior ou igual a 0. Exemplo: 30",
            component: createTextInput({
                customId: "profitMarginPercent",
                required: true,
                style: TextInputStyle.Short,
                placeholder: "30",
                value: config.profitMarginPercent?.toString(),
            }),
        }),
    );
}

function renderMaterialSection(page: ConfigPanelPage, section: SectionDefinition, config: BotConfigView) {
    const priceCents = config[section.priceField];
    const sheetCount = config[section.countField];
    const unitPriceCents = calculateUnitPriceCents(priceCents, sheetCount);

    return createSection(
        [
            `**${section.title}**`,
            `**Preco do pacote:** ${formatCurrencyFromCents(priceCents)}`,
            `**Folhas no pacote:** ${sheetCount ?? "Nao configurado"}`,
            `**Preco por folha:** ${formatCurrencyFromCents(unitPriceCents)}`,
            "Clique em Editar para definir os valores desta secao.",
        ].join("\n"),
        new ButtonBuilder({
            customId: section.id === "default" ? `config/edit/${page}` : `config/edit/${page}/${section.id}`,
            label: "Editar",
            style: ButtonStyle.Primary,
        }),
    );
}

export function getVisibleConfigPanelPages(config: BotConfigView): ConfigPanelPage[] {
    return [
        "production",
        "ticket-categories",
        ...(isEnabled(config.photoLaminatedProductionEnabled) ? ["paper" as const] : []),
        ...(isEnabled(config.foilCardProductionEnabled) ? ["foil" as const] : []),
    ];
}

export function getVisibleConfigPanelPage(page: ConfigPanelPage, config: BotConfigView): ConfigPanelPage {
    const visiblePages = getVisibleConfigPanelPages(config);

    return visiblePages.includes(page) ? page : visiblePages[0];
}

function renderProductionTypeSections(config: BotConfigView) {
    return [
        renderProductionTypeSection({
            id: "photo-laminated",
            title: "Papel fotografico plastificado",
            enabled: isEnabled(config.photoLaminatedProductionEnabled),
        }),
        renderProductionTypeSection({
            id: "foil-card",
            title: "Papel adesivo holografico em cartao (Foil)",
            enabled: isEnabled(config.foilCardProductionEnabled),
        }),
        renderProfitMarginSection(config),
    ];
}

function isEnabled(value: boolean | null) {
    return value ?? true;
}

function renderProductionTypeSection(data: { id: ProductionType; title: string; enabled: boolean }) {
    return createSection(
        [
            `**${data.title}**`,
            `**Status:** ${data.enabled ? "Habilitado" : "Desabilitado"}`,
            "Este tipo ficara disponivel para escolha no futuro fluxo de compra.",
        ].join("\n"),
        new ButtonBuilder({
            customId: `config/toggle-production/${data.id}`,
            label: data.enabled ? "Desabilitar" : "Habilitar",
            style: data.enabled ? ButtonStyle.Danger : ButtonStyle.Success,
        }),
    );
}

function renderProfitMarginSection(config: BotConfigView) {
    const profitMarginPercent = config.profitMarginPercent ?? 0;

    return createSection(
        [
            "**Margem de lucro**",
            `**Percentual:** ${profitMarginPercent}%`,
            "Esta margem sera adicionada ao custo final calculado dos pedidos.",
        ].join("\n"),
        new ButtonBuilder({
            customId: "config/edit-profit-margin",
            label: "Editar",
            style: ButtonStyle.Primary,
        }),
    );
}

function renderTicketCategorySections(config: BotConfigView, guild?: Guild) {
    return ticketCategoryDefinitions.flatMap(definition => [
        [
            `**${definition.title}**`,
            definition.description,
            `**Categoria:** ${formatTicketCategory(config[definition.field], guild)}`,
        ].join("\n"),
        createRow(
            new ChannelSelectMenuBuilder({
                customId: `config/ticket-category/${definition.id}`,
                placeholder: `Selecionar categoria: ${definition.title}`,
                channelTypes: [ChannelType.GuildCategory],
                minValues: 1,
                maxValues: 1,
            }),
        ),
        Separator.Default,
    ]).slice(0, -1);
}

const ticketCategoryDefinitions: {
    id: TicketCategoryType;
    title: string;
    description: string;
    field: keyof Pick<BotConfigView, "newTicketsCategoryId" | "pendingPaymentCategoryId" | "awaitingDeliveryCategoryId">;
}[] = [
    {
        id: "new",
        title: "Tickets Novos",
        description: "Tickets recem criados antes da geracao do codigo PIX.",
        field: "newTicketsCategoryId",
    },
    {
        id: "pending",
        title: "Pendentes",
        description: "Tickets aguardando confirmacao de pagamento.",
        field: "pendingPaymentCategoryId",
    },
    {
        id: "awaiting",
        title: "Aguardando",
        description: "Tickets pagos aguardando preparo, confirmacao ou entrega.",
        field: "awaitingDeliveryCategoryId",
    },
];

function formatTicketCategory(categoryId: string | null, guild?: Guild) {
    if (!categoryId) {
        return "Nao configurado";
    }

    const channel = guild?.channels.cache.get(categoryId);
    if (!channel || channel.type !== ChannelType.GuildCategory) {
        return "Categoria nao encontrada";
    }

    return `${channel.name} (\`${categoryId}\`)`;
}

export function getSectionDefinition(page: ConfigPanelPage, sectionId: ConfigPanelSection) {
    const definition = pageDefinitions[page];

    return definition.sections.find(section => section.id === sectionId) ?? definition.sections[0];
}
