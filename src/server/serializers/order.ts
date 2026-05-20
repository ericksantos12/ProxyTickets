export const orderFields = {
    oid: true,
    guildId: true,
    channelId: true,
    userId: true,
    responsibleAdminId: true,
    status: true,
    cardType: true,
    cardCount: true,
    deckLink: true,
    sheetCount: true,
    materialCostCents: true,
    profitMarginPercent: true,
    finalPriceCents: true,
    paymentMethod: true,
    paymentStatus: true,
    paymentExpiresAt: true,
    paidAt: true,
    cancelledAt: true,
    confirmedAt: true,
    concludedAt: true,
    createdAt: true,
    updatedAt: true,
} as const;

export function serializeOrder(order: {
    oid: string;
    guildId: string;
    channelId: string;
    userId: string;
    responsibleAdminId: string | null;
    status: string;
    cardType: string | null;
    cardCount: number | null;
    deckLink: string | null;
    sheetCount: number | null;
    materialCostCents: number | null;
    profitMarginPercent: number | null;
    finalPriceCents: number | null;
    paymentMethod: string | null;
    paymentStatus: string | null;
    paymentExpiresAt: Date | null;
    paidAt: Date | null;
    cancelledAt: Date | null;
    confirmedAt: Date | null;
    concludedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}) {
    return {
        id: order.oid,
        oid: order.oid,
        guildId: order.guildId,
        channelId: order.channelId,
        userId: order.userId,
        responsibleAdminId: order.responsibleAdminId,
        status: order.status,
        cardType: order.cardType,
        cardCount: order.cardCount,
        deckLink: order.deckLink,
        sheetCount: order.sheetCount,
        materialCostCents: order.materialCostCents,
        profitMarginPercent: order.profitMarginPercent,
        finalPriceCents: order.finalPriceCents,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        paymentExpiresAt: order.paymentExpiresAt,
        paidAt: order.paidAt,
        cancelledAt: order.cancelledAt,
        confirmedAt: order.confirmedAt,
        concludedAt: order.concludedAt,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
    };
}
