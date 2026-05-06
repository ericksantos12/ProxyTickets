import { createResponder } from "#base";
import { prisma } from "#database";
import { calculateCardOrderPrice, formatTicketChannelName, fromPrismaTicketOrderCardType, getOrCreateBotConfig, isTicketOrderCardTypeInput, parseDeckLink, parseTicketCardCount, toPrismaTicketOrderCardType, type TicketOrderCardTypeInput } from "#functions";
import { ResponderType } from "@constatic/base";
import { ChannelType, PermissionFlagsBits } from "discord.js";
import { createTicketDetailsModal, renderCancelConfirmation, renderCancelConfirmed, renderCancelKept, renderCardTypeSelection, renderInitialTicketMessage, renderOrderReview, renderPendingConfirmation, renderPixPayment, renderSelectedCardType } from "../../menus/ticket-order.js";
import { ensureTicketOwnerPermissions } from "../../shared/ticket-permissions.js";

createResponder({
    customId: "ticket/create",
    types: [ResponderType.Button],
    cache: "cached",
    async run(interaction) {
        await interaction.deferReply({ flags: ["Ephemeral"] });

        const config = await getOrCreateBotConfig(interaction.guildId);
        if (!config.newTicketsCategoryId) {
            await interaction.editReply("A categoria de Tickets Novos ainda nao foi configurada em /config.");
            return;
        }

        const category = await interaction.guild.channels.fetch(config.newTicketsCategoryId).catch(() => null);
        if (!category || category.type !== ChannelType.GuildCategory) {
            await interaction.editReply("A categoria de Tickets Novos configurada nao foi encontrada.");
            return;
        }

        const channelName = formatTicketChannelName("new", interaction.user.username);
        const channel = await interaction.guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: category.id,
            reason: `Ticket criado por ${interaction.user.tag}`,
        });

        try {
            await ensureTicketOwnerPermissions(channel, interaction.user.id, "Adicionar usuario ao ticket");

            await prisma.ticketOrder.create({
                data: {
                    guildId: interaction.guildId,
                    channelId: channel.id,
                    userId: interaction.user.id,
                    status: "AWAITING_USER_DETAILS",
                },
            });

            await channel.send(renderInitialTicketMessage(interaction.user.id));
            await interaction.editReply(`Ticket criado: ${channel}`);
        } catch (error) {
            await channel.delete("Falha ao inicializar ticket").catch(() => null);
            throw error;
        }
    },
});

createResponder({
    customId: "ticket/cancel/request",
    types: [ResponderType.Button],
    cache: "cached",
    async run(interaction) {
        const order = await getChannelOrder(interaction.channelId);
        if (!order) {
            await interaction.reply({ flags: ["Ephemeral"], content: "Este canal nao possui um ticket ativo." });
            return;
        }

        if (!canCancelTicket(interaction.user.id, order.userId, interaction.memberPermissions)) {
            await interaction.reply({ flags: ["Ephemeral"], content: "Apenas o usuario do ticket ou um admin pode desistir deste ticket." });
            return;
        }

        await interaction.reply(renderCancelConfirmation());
    },
});

createResponder({
    customId: "ticket/cancel/keep",
    types: [ResponderType.Button],
    cache: "cached",
    async run(interaction) {
        await interaction.update(renderCancelKept());
    },
});

createResponder({
    customId: "ticket/cancel/confirm",
    types: [ResponderType.Button],
    cache: "cached",
    async run(interaction) {
        const order = await getChannelOrder(interaction.channelId);
        if (!order) {
            await interaction.update(renderCancelKept());
            return;
        }

        if (!canCancelTicket(interaction.user.id, order.userId, interaction.memberPermissions)) {
            await interaction.reply({ flags: ["Ephemeral"], content: "Apenas o usuario do ticket ou um admin pode desistir deste ticket." });
            return;
        }

        await prisma.ticketOrder.update({
            where: { channelId: interaction.channelId },
            data: {
                status: "CANCELLED",
                cancelledAt: new Date(),
            },
        });

        await interaction.update(renderCancelConfirmed());
        await interaction.channel?.delete("Ticket cancelado pelo usuario").catch(() => null);
    },
});

createResponder({
    customId: "ticket/details/start",
    types: [ResponderType.Button],
    cache: "cached",
    async run(interaction) {
        const order = await getChannelOrder(interaction.channelId);
        if (!order) {
            await interaction.reply({ flags: ["Ephemeral"], content: "Este canal nao possui um ticket ativo." });
            return;
        }
        if (!canEditTicketDetails(interaction.user.id, order.userId, order.status)) {
            await interaction.reply({ flags: ["Ephemeral"], content: "Voce nao pode preencher este pedido agora." });
            return;
        }

        const config = await getOrCreateBotConfig(interaction.guildId);
        const cardTypes = getEnabledCardTypes(config);
        if (cardTypes.length === 0) {
            await interaction.reply({ flags: ["Ephemeral"], content: "Nenhum tipo de confeccao esta habilitado em /config." });
            return;
        }

        await interaction.update(renderCardTypeSelection(cardTypes));
    },
});

createResponder({
    customId: "ticket/details/type",
    types: [ResponderType.StringSelect],
    cache: "cached",
    async run(interaction) {
        const selectedCardType = interaction.values[0];
        if (!selectedCardType || !isTicketOrderCardTypeInput(selectedCardType)) {
            await interaction.reply({ flags: ["Ephemeral"], content: "Selecione um tipo de carta valido." });
            return;
        }

        const order = await getChannelOrder(interaction.channelId);
        if (!order) {
            await interaction.reply({ flags: ["Ephemeral"], content: "Este canal nao possui um ticket ativo." });
            return;
        }
        if (!canEditTicketDetails(interaction.user.id, order.userId, order.status)) {
            await interaction.reply({ flags: ["Ephemeral"], content: "Voce nao pode preencher este pedido agora." });
            return;
        }

        const config = await getOrCreateBotConfig(interaction.guildId);
        if (!getEnabledCardTypes(config).includes(selectedCardType)) {
            await interaction.reply({ flags: ["Ephemeral"], content: "Este tipo de carta nao esta habilitado em /config." });
            return;
        }

        await interaction.update(renderSelectedCardType(selectedCardType));
    },
});

createResponder({
    customId: "ticket/details/open/:cardType",
    types: [ResponderType.Button],
    cache: "cached",
    parse: params => ({
        cardType: parseCardType(params.cardType),
    }),
    async run(interaction, { cardType }) {
        const order = await getChannelOrder(interaction.channelId);
        if (!order) {
            await interaction.reply({ flags: ["Ephemeral"], content: "Este canal nao possui um ticket ativo." });
            return;
        }
        if (!canEditTicketDetails(interaction.user.id, order.userId, order.status)) {
            await interaction.reply({ flags: ["Ephemeral"], content: "Voce nao pode preencher este pedido agora." });
            return;
        }

        const config = await getOrCreateBotConfig(interaction.guildId);
        if (!getEnabledCardTypes(config).includes(cardType)) {
            await interaction.reply({ flags: ["Ephemeral"], content: "Este tipo de carta nao esta habilitado em /config." });
            return;
        }

        await interaction.showModal(createTicketDetailsModal(cardType, {
            cardCount: order.cardCount ?? undefined,
            deckLink: order.deckLink ?? undefined,
        }));
    },
});

createResponder({
    customId: "ticket/details/submit/:cardType",
    types: [ResponderType.ModalComponent],
    cache: "cached",
    parse: params => ({
        cardType: parseCardType(params.cardType),
    }),
    async run(interaction, { cardType }) {
        const order = await getChannelOrder(interaction.channelId);
        if (!order) {
            await interaction.reply({ flags: ["Ephemeral"], content: "Este canal nao possui um ticket ativo." });
            return;
        }
        if (!canEditTicketDetails(interaction.user.id, order.userId, order.status)) {
            await interaction.reply({ flags: ["Ephemeral"], content: "Voce nao pode preencher este pedido agora." });
            return;
        }

        const config = await getOrCreateBotConfig(interaction.guildId);
        if (!getEnabledCardTypes(config).includes(cardType)) {
            await interaction.reply({ flags: ["Ephemeral"], content: "Este tipo de carta nao esta habilitado em /config." });
            return;
        }

        const cardCount = parseTicketCardCount(interaction.fields.getTextInputValue("cardCount"));
        if (!cardCount.ok) {
            await interaction.reply({ flags: ["Ephemeral"], content: cardCount.error });
            return;
        }

        const deckLink = parseDeckLink(interaction.fields.getTextInputValue("deckLink"));
        if (!deckLink.ok) {
            await interaction.reply({ flags: ["Ephemeral"], content: deckLink.error });
            return;
        }

        const status = order.responsibleAdminId ? "IN_REVIEW" : "PENDING_CONFIRMATION";

        await prisma.ticketOrder.update({
            where: { channelId: interaction.channelId },
            data: {
                status,
                cardType: toPrismaTicketOrderCardType(cardType),
                cardCount: cardCount.value,
                deckLink: deckLink.value,
            },
        });

        const details = {
            cardType,
            cardCount: cardCount.value,
            deckLink: deckLink.value,
        };

        await interaction.update(order.responsibleAdminId
            ? renderOrderReview(order.userId, order.responsibleAdminId, details)
            : renderPendingConfirmation(order.userId, details));
    },
});

createResponder({
    customId: "ticket/claim",
    types: [ResponderType.Button],
    cache: "cached",
    async run(interaction) {
        if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
            await interaction.reply({ flags: ["Ephemeral"], content: "Voce nao tem permissao para assumir pedidos." });
            return;
        }

        const order = await getChannelOrder(interaction.channelId);
        if (!order) {
            await interaction.reply({ flags: ["Ephemeral"], content: "Este canal nao possui um ticket ativo." });
            return;
        }
        if (order.status === "CANCELLED" || order.status === "PENDING_PAYMENT") {
            await interaction.reply({ flags: ["Ephemeral"], content: "Este pedido nao pode ser assumido agora." });
            return;
        }
        if (order.responsibleAdminId && order.responsibleAdminId !== interaction.user.id) {
            await interaction.reply({ flags: ["Ephemeral"], content: `Este pedido ja foi assumido por <@${order.responsibleAdminId}>.` });
            return;
        }

        const details = getOrderDetails(order);
        if (!details) {
            await interaction.reply({ flags: ["Ephemeral"], content: "O usuario ainda nao preencheu as informacoes do pedido." });
            return;
        }

        await prisma.ticketOrder.update({
            where: { channelId: interaction.channelId },
            data: {
                status: "IN_REVIEW",
                responsibleAdminId: interaction.user.id,
            },
        });

        await interaction.update(renderOrderReview(order.userId, interaction.user.id, details));
    },
});

createResponder({
    customId: "ticket/confirm",
    types: [ResponderType.Button],
    cache: "cached",
    async run(interaction) {
        const order = await getChannelOrder(interaction.channelId);
        if (!order) {
            await interaction.reply({ flags: ["Ephemeral"], content: "Este canal nao possui um ticket ativo." });
            return;
        }
        if (!order.responsibleAdminId) {
            await interaction.reply({ flags: ["Ephemeral"], content: "Um admin precisa assumir este pedido antes de confirmar." });
            return;
        }
        if (order.responsibleAdminId !== interaction.user.id) {
            await interaction.reply({ flags: ["Ephemeral"], content: "Apenas o admin responsavel pode confirmar este pedido." });
            return;
        }
        if (order.status !== "IN_REVIEW") {
            await interaction.reply({ flags: ["Ephemeral"], content: "Este pedido nao pode ser confirmado agora." });
            return;
        }

        const details = getOrderDetails(order);
        if (!details) {
            await interaction.reply({ flags: ["Ephemeral"], content: "O pedido ainda nao possui todas as informacoes necessarias." });
            return;
        }

        const config = await getOrCreateBotConfig(interaction.guildId);
        if (!config.pendingPaymentCategoryId) {
            await interaction.reply({ flags: ["Ephemeral"], content: "A categoria de Pendentes ainda nao foi configurada em /config." });
            return;
        }

        const pendingCategory = await interaction.guild.channels.fetch(config.pendingPaymentCategoryId).catch(() => null);
        if (!pendingCategory || pendingCategory.type !== ChannelType.GuildCategory) {
            await interaction.reply({ flags: ["Ephemeral"], content: "A categoria de Pendentes configurada nao foi encontrada." });
            return;
        }

        const price = calculateCardOrderPrice(details.cardType, details.cardCount, config);
        if (!price.ok) {
            await interaction.reply({ flags: ["Ephemeral"], content: price.error });
            return;
        }

        const channel = await interaction.guild.channels.fetch(interaction.channelId).catch(() => null);
        if (!channel || channel.type !== ChannelType.GuildText) {
            await interaction.reply({ flags: ["Ephemeral"], content: "Nao foi possivel encontrar o canal do ticket." });
            return;
        }

        const user = await interaction.client.users.fetch(order.userId).catch(() => null);
        const nextChannelName = formatTicketChannelName("pending", user?.username ?? "usuario");

        const payerEmail = getMercadoPagoPayerEmail(order.userId);

        const { createPixPayment } = await import("../../../lib/mercado-pago.js");
        const pix = await createPixPayment(
            price.value.finalPriceCents / 100,
            `Pedido proxies - ${details.cardCount} cartas`,
            payerEmail,
        ).catch(async error => {
            console.error("Failed to create Mercado Pago PIX payment:", error);
            await interaction.reply({ flags: ["Ephemeral"], content: getMercadoPagoPaymentErrorMessage(error) });
            return null;
        });
        if (!pix) {
            return;
        }

        await channel.setParent(pendingCategory.id, { lockPermissions: false, reason: "Pedido confirmado e aguardando pagamento" });
        await ensureTicketOwnerPermissions(channel, order.userId, "Manter acesso do usuario ao mover categoria");
        await channel.setName(nextChannelName, "Pedido confirmado e aguardando pagamento");

        await prisma.ticketOrder.update({
            where: { channelId: interaction.channelId },
            data: {
                status: "PENDING_PAYMENT",
                sheetCount: price.value.sheetCount,
                materialCostCents: price.value.materialCostCents,
                profitMarginPercent: price.value.profitMarginPercent,
                finalPriceCents: price.value.finalPriceCents,
                confirmedAt: new Date(),
                paymentId: pix.paymentId,
                paymentStatus: pix.status,
                paymentQrCodeBase64: pix.qrCodeBase64,
                paymentCopyPaste: pix.copyPaste,
                paymentExpiresAt: pix.expiresAt,
            },
        });

        if (pix.qrCodeBase64) {
            const buffer = Buffer.from(pix.qrCodeBase64, "base64");
            await interaction.update({
                ...renderPixPayment(order.userId, interaction.user.id, details, price.value, pix.copyPaste ?? "Nao disponivel"),
                files: [{ attachment: buffer, name: "qrcode.png" }],
            });
        } else {
            await interaction.update(renderPixPayment(order.userId, interaction.user.id, details, price.value, pix.copyPaste ?? "Nao disponivel"));
        }
    },
});

async function getChannelOrder(channelId: string) {
    return prisma.ticketOrder.findUnique({
        where: { channelId },
    });
}

function canCancelTicket(userId: string, orderUserId: string, permissions: { has(permission: bigint): boolean }) {
    return userId === orderUserId || permissions.has(PermissionFlagsBits.ManageGuild);
}

function canEditTicketDetails(userId: string, orderUserId: string, status: string) {
    return userId === orderUserId && status !== "CANCELLED" && status !== "PENDING_PAYMENT";
}

function getEnabledCardTypes(config: { photoLaminatedProductionEnabled: boolean | null; foilCardProductionEnabled: boolean | null }) {
    return [
        ...((config.photoLaminatedProductionEnabled ?? true) ? ["photo-laminated" as const] : []),
        ...((config.foilCardProductionEnabled ?? true) ? ["foil-card" as const] : []),
    ];
}

function parseCardType(cardType: string): TicketOrderCardTypeInput {
    return isTicketOrderCardTypeInput(cardType) ? cardType : "photo-laminated";
}

function getOrderDetails(order: { cardType: string | null; cardCount: number | null; deckLink: string | null }) {
    const cardType = fromPrismaTicketOrderCardType(order.cardType);
    if (!cardType || order.cardCount === null) {
        return null;
    }

    return {
        cardType,
        cardCount: order.cardCount,
        deckLink: order.deckLink,
    };
}

function getMercadoPagoPayerEmail(userId: string) {
    return `discord-${userId}@example.com`;
}

function getMercadoPagoPaymentErrorMessage(error: unknown) {
    const message = typeof error === "object" && error && "message" in error
        ? String(error.message)
        : "";

    if (message.includes("Unauthorized use of live credentials")) {
        return "O Mercado Pago recusou a criacao do PIX porque credenciais de producao foram usadas em um fluxo de teste. Verifique se `MP_SANDBOX=true` esta configurado para testes.";
    }

    if (message.includes("Invalid test user email")) {
        return "O Mercado Pago recusou o email do pagador de teste. Verifique `MP_TEST_PAYER_EMAIL` ou use a Orders API com `MP_SANDBOX=true`.";
    }

    return "Nao foi possivel gerar o PIX no Mercado Pago. Tente novamente em instantes.";
}
