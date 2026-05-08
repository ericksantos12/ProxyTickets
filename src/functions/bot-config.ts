import { prisma } from "#database";

export type BotConfigUpdateData = {
    paperPackPriceCents?: number;
    paperPackSheetCount?: number;
    laminationPackPriceCents?: number;
    laminationPackSheetCount?: number;
    holographicStickerPackPriceCents?: number;
    holographicStickerPackSheetCount?: number;
    cardstockPackPriceCents?: number;
    cardstockPackSheetCount?: number;
    photoLaminatedProductionEnabled?: boolean;
    foilCardProductionEnabled?: boolean;
    profitMarginPercent?: number;
    newTicketsCategoryId?: string;
    pendingPaymentCategoryId?: string;
    awaitingDeliveryCategoryId?: string;
    fallbackPixKey?: string | null;
};

export async function getOrCreateBotConfig(guildId: string) {
    await prisma.guild.upsert({
        where: { id: guildId },
        update: {},
        create: { id: guildId },
    });

    return prisma.guildBotConfig.upsert({
        where: { guildId },
        update: {},
        create: { guildId },
    });
}

export async function updateBotConfig(guildId: string, data: BotConfigUpdateData) {
    await prisma.guild.upsert({
        where: { id: guildId },
        update: {},
        create: { id: guildId },
    });

    return prisma.guildBotConfig.upsert({
        where: { guildId },
        update: data,
        create: {
            guildId,
            ...data,
        },
    });
}
