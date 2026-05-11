import { createResponder } from "#base";
import { prisma } from "#database";
import { calculateCardOrderPrice, formatTicketChannelName, fromPrismaTicketOrderCardType, getOrCreateBotConfig, isTicketOrderCardTypeInput, parseDeckLink, parseTicketCardCount, replaceChannelStageEmoji, toPrismaTicketOrderCardType, type CardOrderPrice, type TicketOrderCardTypeInput } from "#functions";
import { ResponderType } from "@constatic/base";
import { ChannelType, PermissionFlagsBits, type ButtonInteraction, type TextChannel } from "discord.js";
import { createTicketDetailsModal, renderCancelConfirmation, renderCancelConfirmed, renderCancelKept, renderCardTypeSelection, renderInitialTicketMessage, renderManualPixPayment, renderOrderConcluded, renderOrderConfirmed, renderOrderReview, renderPendingConfirmation, renderPixPayment, renderSelectedCardType } from "../../menus/ticket-order.js";
import { approveTicketOrderPayment } from "../../shared/payment-approval.js";
import { ensureTicketOwnerPermissions, removeTicketOwnerPermissions } from "../../shared/ticket-permissions.js";
import { sendNewTicketNotification, sendOrderDetailsNotification } from "../../shared/ticket-notifications.js";

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
            await sendNewTicketNotification({
                client: interaction.client,
                guildId: interaction.guildId,
                channelId: channel.id,
                userId: interaction.user.id,
            });
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

        await interaction.update(renderCardTypeSelection(cardTypes, shouldShowEditBackButton(order)));
    },
});

createResponder({
    customId: "ticket/details/back",
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

        const details = getOrderDetails(order);
        if (!details) {
            await interaction.reply({ flags: ["Ephemeral"], content: "O pedido ainda nao possui todas as informacoes necessarias." });
            return;
        }

        const config = await getOrCreateBotConfig(interaction.guildId);
        const price = calculateCardOrderPrice(details.cardType, details.cardCount, config);
        if (!price.ok) {
            await interaction.reply({ flags: ["Ephemeral"], content: price.error });
            return;
        }

        if (order.status === "IN_REVIEW" && order.responsibleAdminId) {
            await interaction.update(renderOrderReview(order.userId, order.responsibleAdminId, details, price.value));
            return;
        }

        if (order.status === "PENDING_CONFIRMATION") {
            await interaction.update(renderPendingConfirmation(order.userId, details, price.value));
            return;
        }

        await interaction.reply({ flags: ["Ephemeral"], content: "Nao ha uma tela anterior para voltar neste pedido." });
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

        await interaction.update(renderSelectedCardType(selectedCardType, shouldShowEditBackButton(order)));
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

        const details = {
            cardType,
            cardCount: cardCount.value,
            deckLink: deckLink.value,
        };

        const price = calculateCardOrderPrice(details.cardType, details.cardCount, config);
        if (!price.ok) {
            await interaction.reply({ flags: ["Ephemeral"], content: price.error });
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

        await interaction.update(order.responsibleAdminId
            ? renderOrderReview(order.userId, order.responsibleAdminId, details, price.value)
            : renderPendingConfirmation(order.userId, details, price.value));
        await sendOrderDetailsNotification({
            client: interaction.client,
            guildId: interaction.guildId,
            channelId: interaction.channelId,
            userId: order.userId,
            responsibleAdminId: order.responsibleAdminId,
            details,
            price: price.value,
        });
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

        const config = await getOrCreateBotConfig(interaction.guildId);
        const price = calculateCardOrderPrice(details.cardType, details.cardCount, config);
        if (!price.ok) {
            await interaction.reply({ flags: ["Ephemeral"], content: price.error });
            return;
        }

        await prisma.ticketOrder.update({
            where: { channelId: interaction.channelId },
            data: {
                status: "IN_REVIEW",
                responsibleAdminId: interaction.user.id,
            },
        });

        await interaction.update(renderOrderReview(order.userId, interaction.user.id, details, price.value));
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

        await interaction.deferUpdate();

        const config = await getOrCreateBotConfig(interaction.guildId);
        if (!config.pendingPaymentCategoryId) {
            await interaction.followUp({ flags: ["Ephemeral"], content: "A categoria de Pendentes ainda nao foi configurada em /config." });
            return;
        }

        const pendingCategory = await interaction.guild.channels.fetch(config.pendingPaymentCategoryId).catch(() => null);
        if (!pendingCategory || pendingCategory.type !== ChannelType.GuildCategory) {
            await interaction.followUp({ flags: ["Ephemeral"], content: "A categoria de Pendentes configurada nao foi encontrada." });
            return;
        }

        const price = calculateCardOrderPrice(details.cardType, details.cardCount, config);
        if (!price.ok) {
            await interaction.followUp({ flags: ["Ephemeral"], content: price.error });
            return;
        }

        const channel = await interaction.guild.channels.fetch(interaction.channelId).catch(() => null);
        if (!channel || channel.type !== ChannelType.GuildText) {
            await interaction.followUp({ flags: ["Ephemeral"], content: "Nao foi possivel encontrar o canal do ticket." });
            return;
        }

        const nextChannelName = replaceChannelStageEmoji(channel.name, "pending");

        const payerEmail = getMercadoPagoPayerEmail(order.userId);

        const { createPixPayment } = await import("../../../lib/mercado-pago.js");
        const pix = await createPixPayment(
            price.value.finalPriceCents / 100,
            `Pedido proxies - ${details.cardCount} cartas`,
            payerEmail,
        ).catch(error => {
            console.error("Failed to create Mercado Pago PIX payment:", error);
            return { error } as const;
        });

        if ("error" in pix) {
            if (!config.fallbackPixKey) {
                await interaction.followUp({ flags: ["Ephemeral"], content: `${getMercadoPagoPaymentErrorMessage(pix.error)} Configure a chave PIX manual em /config para usar o fallback.` });
                return;
            }

            await startManualPixPayment({
                interaction,
                order,
                details,
                price: price.value,
                pendingCategoryId: pendingCategory.id,
                channel,
                nextChannelName,
                fallbackPixKey: config.fallbackPixKey,
            });
            await interaction.followUp({ flags: ["Ephemeral"], content: "O Mercado Pago falhou. Usei o PIX manual configurado como fallback." });
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
                paymentMethod: "MERCADO_PAGO",
                paymentStatus: pix.status,
                paymentQrCodeBase64: pix.qrCodeBase64,
                paymentCopyPaste: pix.copyPaste,
                paymentExpiresAt: pix.expiresAt,
            },
        });

        await interaction.editReply(renderOrderConfirmed(order.userId, interaction.user.id, details, price.value));

        if (pix.qrCodeBase64) {
            const qrCodeFileName = "qrcode.png";
            const pixMessage = renderPixPayment(order.userId, interaction.user.id, details, price.value, pix.copyPaste ?? "Nao disponivel", qrCodeFileName);
            const buffer = Buffer.from(pix.qrCodeBase64, "base64");
            const paymentMessage = await channel.send({
                ...pixMessage,
                files: [{ attachment: buffer, name: qrCodeFileName }],
            });
            await savePaymentMessageId(interaction.channelId, paymentMessage.id);
        } else {
            const pixMessage = renderPixPayment(order.userId, interaction.user.id, details, price.value, pix.copyPaste ?? "Nao disponivel");
            const paymentMessage = await channel.send(pixMessage);
            await savePaymentMessageId(interaction.channelId, paymentMessage.id);
        }
    },
});

createResponder({
    customId: "ticket/confirm-manual",
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

        await interaction.deferUpdate();

        const config = await getOrCreateBotConfig(interaction.guildId);
        if (!config.fallbackPixKey) {
            await interaction.followUp({ flags: ["Ephemeral"], content: "Configure a chave PIX manual em /config antes de usar PIX manual." });
            return;
        }
        if (!config.pendingPaymentCategoryId) {
            await interaction.followUp({ flags: ["Ephemeral"], content: "A categoria de Pendentes ainda nao foi configurada em /config." });
            return;
        }

        const pendingCategory = await interaction.guild.channels.fetch(config.pendingPaymentCategoryId).catch(() => null);
        if (!pendingCategory || pendingCategory.type !== ChannelType.GuildCategory) {
            await interaction.followUp({ flags: ["Ephemeral"], content: "A categoria de Pendentes configurada nao foi encontrada." });
            return;
        }

        const price = calculateCardOrderPrice(details.cardType, details.cardCount, config);
        if (!price.ok) {
            await interaction.followUp({ flags: ["Ephemeral"], content: price.error });
            return;
        }

        const channel = await interaction.guild.channels.fetch(interaction.channelId).catch(() => null);
        if (!channel || channel.type !== ChannelType.GuildText) {
            await interaction.followUp({ flags: ["Ephemeral"], content: "Nao foi possivel encontrar o canal do ticket." });
            return;
        }

        const nextChannelName = replaceChannelStageEmoji(channel.name, "pending");

        await startManualPixPayment({
            interaction,
            order,
            details,
            price: price.value,
            pendingCategoryId: pendingCategory.id,
            channel,
            nextChannelName,
            fallbackPixKey: config.fallbackPixKey,
        });
    },
});

createResponder({
    customId: "ticket/confirm-payment",
    types: [ResponderType.Button],
    cache: "cached",
    async run(interaction) {
        const order = await getChannelOrder(interaction.channelId);
        if (!order) {
            await interaction.reply({ flags: ["Ephemeral"], content: "Este canal nao possui um ticket ativo." });
            return;
        }
        if (order.status !== "PENDING_PAYMENT" || order.paymentMethod !== "MANUAL") {
            await interaction.reply({ flags: ["Ephemeral"], content: "Este pedido nao esta aguardando confirmacao manual de pagamento." });
            return;
        }
        if (!order.responsibleAdminId || order.responsibleAdminId !== interaction.user.id) {
            await interaction.reply({ flags: ["Ephemeral"], content: "Apenas o admin responsavel pode confirmar este pagamento." });
            return;
        }

        await interaction.deferUpdate();
        await approveTicketOrderPayment(order, interaction.client, "manual_confirmed");
        await interaction.followUp({ flags: ["Ephemeral"], content: "Pagamento manual confirmado. O pedido foi movido para aguardando entrega." }).catch(() => null);
    },
});

createResponder({
    customId: "ticket/deliver",
    types: [ResponderType.Button],
    cache: "cached",
    async run(interaction) {
        const order = await getChannelOrder(interaction.channelId);
        if (!order) {
            await interaction.reply({ flags: ["Ephemeral"], content: "Este canal nao possui um ticket ativo." });
            return;
        }
        if (order.status !== "AWAITING_DELIVERY" && order.status !== "CONCLUDED") {
            await interaction.reply({ flags: ["Ephemeral"], content: "Este pedido nao esta aguardando entrega." });
            return;
        }
        if (!order.responsibleAdminId || order.responsibleAdminId !== interaction.user.id) {
            await interaction.reply({ flags: ["Ephemeral"], content: "Apenas o admin responsavel pode concluir este pedido." });
            return;
        }

        try {
            await interaction.deferUpdate();

            const channel = await interaction.guild.channels.fetch(interaction.channelId).catch(() => null);
            const channelFound = channel && channel.type === ChannelType.GuildText;
            if (!channelFound) {
                console.error(`Failed to conclude ticket order for ${interaction.channelId}: ticket channel not found.`);
            }

            await prisma.ticketOrder.update({
                where: { channelId: interaction.channelId },
                data: {
                    status: "CONCLUDED",
                    concludedAt: new Date(),
                },
            });

            const warnings: string[] = [];
            if (channelFound) {
                await removeTicketOwnerPermissions(channel, order.userId, "Pedido concluido e entregue").catch(error => {
                    console.error(`Failed to hide concluded ticket channel ${interaction.channelId} from ${order.userId}:`, error);
                    warnings.push("Nao consegui ocultar o canal do cliente. Verifique a permissao Manage Roles do bot.");
                });
            } else {
                warnings.push("Nao consegui encontrar o canal do ticket.");
            }

            await interaction.editReply(renderOrderConcluded(order.userId, order.responsibleAdminId, order.finalPriceCents)).catch(error => {
                console.error(`Failed to update concluded ticket message for ${interaction.channelId}:`, error);
                warnings.push("Nao consegui atualizar a mensagem do pedido.");
            });

            const warningText = warnings.length ? `\n\nAvisos:\n- ${warnings.join("\n- ")}` : "";
            await interaction.followUp({ flags: ["Ephemeral"], content: `Pedido concluido. O canal ficara visivel para admins por 24 horas.${warningText}` }).catch(() => null);
        } catch (error) {
            console.error(`Failed to conclude ticket order for ${interaction.channelId}:`, error);
        }
    },
});

async function getChannelOrder(channelId: string) {
    return prisma.ticketOrder.findUnique({
        where: { channelId },
    });
}

async function savePaymentMessageId(channelId: string, paymentMessageId: string) {
    await prisma.ticketOrder.update({
        where: { channelId },
        data: { paymentMessageId },
    });
}

async function startManualPixPayment({
    interaction,
    order,
    details,
    price,
    pendingCategoryId,
    channel,
    nextChannelName,
    fallbackPixKey,
}: {
    interaction: ButtonInteraction<"cached">;
    order: { userId: string; responsibleAdminId: string | null };
    details: NonNullable<ReturnType<typeof getOrderDetails>>;
    price: CardOrderPrice;
    pendingCategoryId: string;
    channel: TextChannel;
    nextChannelName: string;
    fallbackPixKey: string;
}) {
    await channel.setParent(pendingCategoryId, { lockPermissions: false, reason: "Pedido confirmado e aguardando pagamento manual" });
    await ensureTicketOwnerPermissions(channel, order.userId, "Manter acesso do usuario ao mover categoria");
    await channel.setName(nextChannelName, "Pedido confirmado e aguardando pagamento manual");

    await prisma.ticketOrder.update({
        where: { channelId: interaction.channelId },
        data: {
            status: "PENDING_PAYMENT",
            sheetCount: price.sheetCount,
            materialCostCents: price.materialCostCents,
            profitMarginPercent: price.profitMarginPercent,
            finalPriceCents: price.finalPriceCents,
            confirmedAt: new Date(),
            paymentId: null,
            paymentMethod: "MANUAL",
            paymentStatus: "manual_pending",
            paymentQrCodeBase64: null,
            paymentCopyPaste: fallbackPixKey,
            paymentExpiresAt: null,
        },
    });

    await interaction.editReply(renderOrderConfirmed(order.userId, interaction.user.id, details, price));

    const paymentMessage = await channel.send(renderManualPixPayment(order.userId, interaction.user.id, details, price, fallbackPixKey));
    await savePaymentMessageId(interaction.channelId, paymentMessage.id);
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

function shouldShowEditBackButton(order: { status: string; cardType: string | null; cardCount: number | null }) {
    return (order.status === "IN_REVIEW" || order.status === "PENDING_CONFIRMATION")
        && fromPrismaTicketOrderCardType(order.cardType) !== null
        && order.cardCount !== null;
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
