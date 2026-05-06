import { formatCurrencyFromCents, formatTicketOrderCardType, type CardOrderPrice, type TicketOrderCardTypeInput } from "#functions";
import { createContainer, createLabel, createMediaGallery, createModal, createRow, createTextInput, Separator } from "@magicyan/discord";
import { ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, TextInputStyle, type InteractionReplyOptions, type InteractionUpdateOptions } from "discord.js";

export type TicketOrderDetailsView = {
    cardType: TicketOrderCardTypeInput;
    cardCount: number;
    deckLink: string | null;
};

export function renderInitialTicketMessage(userId: string) {
    const container = createContainer("Blue",
        `# Pedido de proxies\n<@${userId}>, informe os dados do pedido para iniciar o atendimento.`,
        Separator.Default,
        [
            "**Informacoes necessarias**",
            "- Tipo de carta: Foil ou Plastificada, conforme configuracao atual.",
            "- Quantidade de cartas.",
            "- Link do deck, se houver.",
        ].join("\n"),
        Separator.Default,
        createRow(
            new ButtonBuilder({
                customId: "ticket/details/start",
                label: "Preencher pedido",
                style: ButtonStyle.Primary,
            }),
            new ButtonBuilder({
                customId: "ticket/cancel/request",
                label: "Desistir",
                style: ButtonStyle.Danger,
            }),
        ),
    );

    return {
        flags: ["IsComponentsV2"],
        components: [container],
    } satisfies InteractionReplyOptions;
}

export function renderCancelConfirmation() {
    const container = createContainer("Red",
        "# Desistir do ticket\nTem certeza que deseja desistir deste ticket? O canal sera apagado.",
        Separator.Default,
        createRow(
            new ButtonBuilder({
                customId: "ticket/cancel/confirm",
                label: "Confirmar desistencia",
                style: ButtonStyle.Danger,
            }),
            new ButtonBuilder({
                customId: "ticket/cancel/keep",
                label: "Voltar",
                style: ButtonStyle.Secondary,
            }),
        ),
    );

    return {
        flags: ["Ephemeral", "IsComponentsV2"],
        components: [container],
    } satisfies InteractionReplyOptions;
}

export function renderCancelKept() {
    const container = createContainer("Grey", "Cancelamento descartado. O ticket continua aberto.");

    return {
        flags: ["IsComponentsV2"],
        components: [container],
    } satisfies InteractionUpdateOptions;
}

export function renderCancelConfirmed() {
    const container = createContainer("Red", "Ticket cancelado. O canal sera apagado em instantes.");

    return {
        flags: ["IsComponentsV2"],
        components: [container],
    } satisfies InteractionUpdateOptions;
}

export function renderCardTypeSelection(cardTypes: TicketOrderCardTypeInput[]) {
    const container = createContainer("Blue",
        "# Preencher pedido\nSelecione o tipo de carta para continuar.",
        Separator.Default,
        createRow(
            new StringSelectMenuBuilder({
                customId: "ticket/details/type",
                placeholder: "Selecione o tipo de carta",
                minValues: 1,
                maxValues: 1,
                options: cardTypes.map(cardType => ({
                    label: formatTicketOrderCardType(cardType),
                    value: cardType,
                })),
            }),
        ),
        Separator.Default,
        createRow(
            new ButtonBuilder({
                customId: "ticket/cancel/request",
                label: "Desistir",
                style: ButtonStyle.Danger,
            }),
        ),
    );

    return {
        flags: ["IsComponentsV2"],
        components: [container],
    } satisfies InteractionUpdateOptions;
}

export function renderSelectedCardType(cardType: TicketOrderCardTypeInput) {
    const container = createContainer("Blue",
        "# Preencher pedido\nTipo de carta selecionado. Abra o formulario para informar quantidade e link, se houver.",
        Separator.Default,
        `**Tipo de carta:** ${formatTicketOrderCardType(cardType)}`,
        Separator.Default,
        createRow(
            new ButtonBuilder({
                customId: `ticket/details/open/${cardType}`,
                label: "Abrir formulario",
                style: ButtonStyle.Primary,
            }),
            new ButtonBuilder({
                customId: "ticket/details/start",
                label: "Trocar tipo",
                style: ButtonStyle.Secondary,
            }),
            new ButtonBuilder({
                customId: "ticket/cancel/request",
                label: "Desistir",
                style: ButtonStyle.Danger,
            }),
        ),
    );

    return {
        flags: ["IsComponentsV2"],
        components: [container],
    } satisfies InteractionUpdateOptions;
}

export function createTicketDetailsModal(cardType: TicketOrderCardTypeInput, details?: Partial<TicketOrderDetailsView>) {
    return createModal(
        `ticket/details/submit/${cardType}`,
        `Pedido ${formatTicketOrderCardType(cardType)}`,
        createLabel({
            label: "Quantidade de cartas",
            description: "Digite um numero inteiro maior que zero.",
            component: createTextInput({
                customId: "cardCount",
                required: true,
                style: TextInputStyle.Short,
                placeholder: "80",
                value: details?.cardCount?.toString(),
            }),
        }),
        createLabel({
            label: "Link do deck",
            description: "Opcional. Informe se houver uma lista online.",
            component: createTextInput({
                customId: "deckLink",
                required: false,
                style: TextInputStyle.Short,
                placeholder: "https://...",
                value: details?.deckLink ?? undefined,
            }),
        }),
    );
}

export function renderPendingConfirmation(userId: string, details: TicketOrderDetailsView) {
    const container = createContainer("Yellow",
        "# Pendencia de confirmacao\nUm admin precisa assumir este pedido para revisar as informacoes com o usuario.",
        Separator.Default,
        [
            `**Usuario:** <@${userId}>`,
            `**Tipo de carta:** ${formatTicketOrderCardType(details.cardType)}`,
            `**Quantidade:** ${details.cardCount}`,
            `**Link do deck:** ${details.deckLink ?? "Nao informado"}`,
        ].join("\n"),
        Separator.Default,
        createRow(
            new ButtonBuilder({
                customId: "ticket/claim",
                label: "Assumir pedido",
                style: ButtonStyle.Primary,
            }),
            new ButtonBuilder({
                customId: "ticket/cancel/request",
                label: "Desistir",
                style: ButtonStyle.Danger,
            }),
        ),
    );

    return {
        flags: ["IsComponentsV2"],
        components: [container],
    } satisfies InteractionUpdateOptions;
}

export function renderOrderReview(userId: string, responsibleAdminId: string, details: TicketOrderDetailsView) {
    const container = createContainer("Green",
        "# Pedido em revisao\nO admin responsavel assumiu o pedido. Confirme as informacoes pelo chat antes do pagamento.",
        Separator.Default,
        [
            `**Usuario:** <@${userId}>`,
            `**Responsavel:** <@${responsibleAdminId}>`,
            `**Tipo de carta:** ${formatTicketOrderCardType(details.cardType)}`,
            `**Quantidade:** ${details.cardCount}`,
            `**Link do deck:** ${details.deckLink ?? "Nao informado"}`,
        ].join("\n"),
        Separator.Default,
        createRow(
            new ButtonBuilder({
                customId: "ticket/confirm",
                label: "Confirmar pedido",
                style: ButtonStyle.Success,
            }),
            new ButtonBuilder({
                customId: "ticket/details/start",
                label: "Editar informacoes",
                style: ButtonStyle.Secondary,
            }),
            new ButtonBuilder({
                customId: "ticket/cancel/request",
                label: "Desistir",
                style: ButtonStyle.Danger,
            }),
        ),
    );

    return {
        flags: ["IsComponentsV2"],
        components: [container],
    } satisfies InteractionUpdateOptions;
}

export function renderOrderConfirmed(userId: string, responsibleAdminId: string, details: TicketOrderDetailsView, price: CardOrderPrice) {
    const container = createContainer("Green",
        "# Pedido confirmado\nO pedido foi confirmado e o PIX foi enviado em uma nova mensagem neste canal.",
        Separator.Default,
        [
            `**Usuario:** <@${userId}>`,
            `**Responsavel:** <@${responsibleAdminId}>`,
            `**Tipo de carta:** ${formatTicketOrderCardType(details.cardType)}`,
            `**Quantidade:** ${details.cardCount}`,
            `**Folhas A4:** ${price.sheetCount}`,
            `**Valor final:** ${formatCurrencyFromCents(price.finalPriceCents)}`,
            `**Link do deck:** ${details.deckLink ?? "Nao informado"}`,
        ].join("\n"),
    );

    return {
        flags: ["IsComponentsV2"],
        components: [container],
    } satisfies InteractionUpdateOptions;
}

export function renderMockPix(userId: string, responsibleAdminId: string, details: TicketOrderDetailsView, price: CardOrderPrice) {
    const pixCode = `PIX-MOCK-${userId}-${price.finalPriceCents}`;
    const container = createContainer("Aqua",
        "# PIX mock gerado\nEste codigo e apenas um mock para teste. Nenhum pagamento real foi gerado.",
        Separator.Default,
        [
            `**Usuario:** <@${userId}>`,
            `**Responsavel:** <@${responsibleAdminId}>`,
            `**Tipo de carta:** ${formatTicketOrderCardType(details.cardType)}`,
            `**Quantidade:** ${details.cardCount}`,
            `**Folhas A4:** ${price.sheetCount}`,
            `**Valor final:** ${formatCurrencyFromCents(price.finalPriceCents)}`,
            `**Link do deck:** ${details.deckLink ?? "Nao informado"}`,
        ].join("\n"),
        Separator.Default,
        [
            "**Copia e cola PIX mock:**",
            `\`${pixCode}\``,
            "Nao use este codigo para pagamento real.",
        ].join("\n"),
    );

    return {
        flags: ["IsComponentsV2"],
        components: [container],
    } satisfies InteractionUpdateOptions;
}

export function renderPixPayment(userId: string, responsibleAdminId: string, details: TicketOrderDetailsView, price: CardOrderPrice, copyPaste: string, qrCodeAttachmentName?: string) {
    const container = createContainer("Aqua",
        "# Pagamento PIX gerado\nEscaneie o QR Code ou use o copia e cola abaixo.",
        Separator.Default,
        [
            `**Usuario:** <@${userId}>`,
            `**Responsavel:** <@${responsibleAdminId}>`,
            `**Tipo de carta:** ${formatTicketOrderCardType(details.cardType)}`,
            `**Quantidade:** ${details.cardCount}`,
            `**Folhas A4:** ${price.sheetCount}`,
            `**Link do deck:** ${details.deckLink ?? "Nao informado"}`,
        ].join("\n"),
        Separator.Default,
        `## Valor total: ${formatCurrencyFromCents(price.finalPriceCents)}`,
        Separator.Default,
        [
            "**Copia e cola PIX:**",
            `\`${copyPaste}\``,
        ].join("\n"),
        qrCodeAttachmentName ? createMediaGallery(`attachment://${qrCodeAttachmentName}`) : undefined,
    );

    return {
        flags: ["IsComponentsV2"],
        components: [container],
    } satisfies InteractionUpdateOptions;
}

export function renderPixPaymentConfirmed(userId: string, finalPriceCents: number | null) {
    const paidValue = finalPriceCents === null ? "Nao informado" : formatCurrencyFromCents(finalPriceCents);
    const container = createContainer("Green",
        "# Pagamento confirmado\nO PIX foi pago e o pedido agora esta em preparo.",
        Separator.Default,
        [
            `**Usuario:** <@${userId}>`,
            `**Valor pago:** ${paidValue} ✅`,
        ].join("\n"),
    );

    return {
        flags: ["IsComponentsV2"],
        components: [container],
    } satisfies InteractionUpdateOptions;
}
