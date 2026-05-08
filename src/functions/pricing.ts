const MAX_PRICE_CENTS = 10_000_000;
const MAX_SHEET_COUNT = 100_000;
const MAX_PROFIT_MARGIN_PERCENT = 1_000;
const MAX_FALLBACK_PIX_KEY_LENGTH = 140;
const CARDS_PER_A4_SHEET = 8;

export type CardOrderType = "photo-laminated" | "foil-card";

export type CardOrderPricingConfig = {
    paperPackPriceCents: number | null;
    paperPackSheetCount: number | null;
    laminationPackPriceCents: number | null;
    laminationPackSheetCount: number | null;
    holographicStickerPackPriceCents: number | null;
    holographicStickerPackSheetCount: number | null;
    cardstockPackPriceCents: number | null;
    cardstockPackSheetCount: number | null;
    profitMarginPercent: number | null;
};

export type CardOrderPrice = {
    cardType: CardOrderType;
    cardCount: number;
    sheetCount: number;
    materialCostCents: number;
    profitMarginPercent: number;
    finalPriceCents: number;
};

export type ParseResult<T> =
    | { ok: true; value: T }
    | { ok: false; error: string };

export function parsePriceCents(input: string): ParseResult<number> {
    const value = input.trim().replace(/\s+/g, "");

    if (!value) {
        return { ok: false, error: "Informe o preco do pacote." };
    }
    if (/[^\d.,]/.test(value)) {
        return { ok: false, error: "Use apenas numeros, virgula ou ponto no preco. Nao use R$." };
    }

    const parsed = normalizeMoney(value);
    if (!parsed) {
        return { ok: false, error: "Informe um preco valido, como 25,90 ou 1.234,56." };
    }

    const cents = parsed.integer * 100 + parsed.decimal;
    if (cents <= 0) {
        return { ok: false, error: "O preco do pacote deve ser maior que zero." };
    }
    if (cents > MAX_PRICE_CENTS) {
        return { ok: false, error: "O preco do pacote deve ser no maximo R$ 100.000,00." };
    }

    return { ok: true, value: cents };
}

export function parseSheetCount(input: string): ParseResult<number> {
    const value = input.trim();

    if (!value) {
        return { ok: false, error: "Informe a quantidade de folhas do pacote." };
    }
    if (!/^\d+$/.test(value)) {
        return { ok: false, error: "A quantidade de folhas deve ser um numero inteiro." };
    }

    const count = Number.parseInt(value, 10);
    if (count < 1) {
        return { ok: false, error: "A quantidade de folhas deve ser maior ou igual a 1." };
    }
    if (count > MAX_SHEET_COUNT) {
        return { ok: false, error: "A quantidade de folhas deve ser no maximo 100.000." };
    }

    return { ok: true, value: count };
}

export function parseProfitMarginPercent(input: string): ParseResult<number> {
    const value = input.trim();

    if (!value) {
        return { ok: false, error: "Informe a margem de lucro." };
    }
    if (!/^\d+$/.test(value)) {
        return { ok: false, error: "A margem de lucro deve ser um numero inteiro maior ou igual a 0." };
    }

    const percent = Number.parseInt(value, 10);
    if (percent > MAX_PROFIT_MARGIN_PERCENT) {
        return { ok: false, error: "A margem de lucro deve ser no maximo 1000%." };
    }

    return { ok: true, value: percent };
}

export function parseFallbackPixKey(input: string): ParseResult<string | null> {
    const value = input.trim();

    if (!value) {
        return { ok: true, value: null };
    }
    if (value.length > MAX_FALLBACK_PIX_KEY_LENGTH) {
        return { ok: false, error: `A chave PIX deve ter no maximo ${MAX_FALLBACK_PIX_KEY_LENGTH} caracteres.` };
    }

    return { ok: true, value };
}

export function calculateUnitPriceCents(priceCents: number | null, sheetCount: number | null): number | null {
    if (priceCents === null || sheetCount === null || sheetCount <= 0) {
        return null;
    }

    return priceCents / sheetCount;
}

export function calculateRequiredSheetCount(cardCount: number): number {
    return Math.ceil(cardCount / CARDS_PER_A4_SHEET);
}

export function calculateCardOrderPrice(cardType: CardOrderType, cardCount: number, config: CardOrderPricingConfig): ParseResult<CardOrderPrice> {
    if (!Number.isInteger(cardCount) || cardCount < 1) {
        return { ok: false, error: "A quantidade de cartas deve ser um numero inteiro maior que zero." };
    }

    const sheetCostCents = calculateCardTypeSheetCostCents(cardType, config);
    if (sheetCostCents === null) {
        return { ok: false, error: "Configure todos os custos de material para este tipo de carta antes de confirmar o pedido." };
    }

    const sheetCount = calculateRequiredSheetCount(cardCount);
    const profitMarginPercent = config.profitMarginPercent ?? 0;
    const materialCostCents = roundCurrencyCents(sheetCostCents * sheetCount);
    const finalPriceCents = roundCurrencyCents(materialCostCents * (1 + profitMarginPercent / 100));

    return {
        ok: true,
        value: {
            cardType,
            cardCount,
            sheetCount,
            materialCostCents,
            profitMarginPercent,
            finalPriceCents,
        },
    };
}

export function formatCurrencyFromCents(cents: number | null): string {
    if (cents === null) {
        return "Nao configurado";
    }

    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(cents / 100);
}

export function formatPriceInput(cents: number | null): string | undefined {
    if (cents === null) {
        return undefined;
    }

    return (cents / 100).toFixed(2).replace(".", ",");
}

function calculateCardTypeSheetCostCents(cardType: CardOrderType, config: CardOrderPricingConfig): number | null {
    if (cardType === "foil-card") {
        return sumNullablePrices(
            calculateUnitPriceCents(config.holographicStickerPackPriceCents, config.holographicStickerPackSheetCount),
            calculateUnitPriceCents(config.cardstockPackPriceCents, config.cardstockPackSheetCount),
        );
    }

    return sumNullablePrices(
        calculateUnitPriceCents(config.paperPackPriceCents, config.paperPackSheetCount),
        calculateUnitPriceCents(config.laminationPackPriceCents, config.laminationPackSheetCount),
    );
}

function sumNullablePrices(...prices: (number | null)[]): number | null {
    return prices.reduce<number | null>((total, price) => (
        total === null || price === null ? null : total + price
    ), 0);
}

function roundCurrencyCents(cents: number): number {
    return Math.ceil(cents);
}

function normalizeMoney(value: string): { integer: number; decimal: number } | null {
    const commaIndex = value.lastIndexOf(",");
    const dotIndex = value.lastIndexOf(".");

    if (commaIndex >= 0 && dotIndex >= 0) {
        const decimalSeparator = commaIndex > dotIndex ? "," : ".";
        const thousandsSeparator = decimalSeparator === "," ? "." : ",";
        return normalizeMoneyParts(value, decimalSeparator, thousandsSeparator);
    }

    const separator = commaIndex >= 0 ? "," : dotIndex >= 0 ? "." : null;
    if (!separator) {
        return digitsToMoney(value, "");
    }

    const parts = value.split(separator);
    if (parts.length > 2) {
        return normalizeThousandsOnly(value, separator);
    }

    const [integerPart, decimalPart] = parts;
    if (!integerPart || !decimalPart) {
        return null;
    }
    if (decimalPart.length <= 2) {
        return digitsToMoney(integerPart, decimalPart);
    }
    if (decimalPart.length === 3 && isValidThousands(integerPart, decimalPart)) {
        return digitsToMoney(`${integerPart}${decimalPart}`, "");
    }

    return null;
}

function normalizeMoneyParts(value: string, decimalSeparator: string, thousandsSeparator: string): { integer: number; decimal: number } | null {
    const decimalParts = value.split(decimalSeparator);
    if (decimalParts.length !== 2) {
        return null;
    }

    const [integerPart, decimalPart] = decimalParts;
    if (!integerPart || !/^\d{1,2}$/.test(decimalPart)) {
        return null;
    }

    const integerGroups = integerPart.split(thousandsSeparator);
    if (!isValidGroupedInteger(integerGroups)) {
        return null;
    }

    return digitsToMoney(integerGroups.join(""), decimalPart);
}

function normalizeThousandsOnly(value: string, thousandsSeparator: string): { integer: number; decimal: number } | null {
    const groups = value.split(thousandsSeparator);
    if (!isValidGroupedInteger(groups)) {
        return null;
    }

    return digitsToMoney(groups.join(""), "");
}

function isValidThousands(integerPart: string, decimalPart: string): boolean {
    return /^\d{1,3}$/.test(integerPart) && /^\d{3}$/.test(decimalPart);
}

function isValidGroupedInteger(groups: string[]): boolean {
    return groups.length > 1
        && /^\d{1,3}$/.test(groups[0] ?? "")
        && groups.slice(1).every(group => /^\d{3}$/.test(group));
}

function digitsToMoney(integerPart: string, decimalPart: string): { integer: number; decimal: number } | null {
    if (!/^\d+$/.test(integerPart)) {
        return null;
    }
    if (decimalPart && !/^\d{1,2}$/.test(decimalPart)) {
        return null;
    }

    return {
        integer: Number.parseInt(integerPart, 10),
        decimal: Number.parseInt(decimalPart.padEnd(2, "0") || "0", 10),
    };
}
