export type TicketChannelStage = "new" | "pending" | "awaiting" | "concluded";
export type TicketOrderCardTypeInput = "photo-laminated" | "foil-card";

const ticketChannelPrefixes: Record<TicketChannelStage, string> = {
    new: "⌛",
    pending: "🛒",
    awaiting: "✅",
    concluded: "✅",
};
const ticketChannelSeparator = "│";
const ticketDateSeparator = "-";

export function formatTicketChannelName(stage: TicketChannelStage, nickname: string, date = new Date()): string {
    const prefix = ticketChannelPrefixes[stage];
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");

    return `${prefix}${ticketChannelSeparator}${sanitizeTicketNickname(nickname)}${ticketChannelSeparator}${day}${ticketDateSeparator}${month}`;
}

export function replaceChannelStageEmoji(currentName: string, stage: TicketChannelStage): string {
    const prefix = ticketChannelPrefixes[stage];

    for (const currentPrefix of Object.values(ticketChannelPrefixes)) {
        if (currentName.startsWith(`${currentPrefix}${ticketChannelSeparator}`)) {
            return `${prefix}${currentName.slice(currentPrefix.length)}`;
        }
    }

    return currentName;
}

export function parseTicketCardCount(input: string) {
    const value = input.trim();

    if (!value) {
        return { ok: false, error: "Informe a quantidade de cartas." } as const;
    }
    if (!/^\d+$/.test(value)) {
        return { ok: false, error: "A quantidade de cartas deve ser um numero inteiro." } as const;
    }

    const count = Number.parseInt(value, 10);
    if (count < 1) {
        return { ok: false, error: "A quantidade de cartas deve ser maior que zero." } as const;
    }
    if (count > 10_000) {
        return { ok: false, error: "A quantidade de cartas deve ser no maximo 10.000." } as const;
    }

    return { ok: true, value: count } as const;
}

export function parseDeckLink(input: string) {
    const value = input.trim();

    if (!value) {
        return { ok: true, value: null } as const;
    }
    if (value.length > 1_000) {
        return { ok: false, error: "O link do deck deve ter no maximo 1000 caracteres." } as const;
    }

    try {
        const url = new URL(value);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
            return { ok: false, error: "O link do deck deve comecar com http:// ou https://." } as const;
        }

        return { ok: true, value: url.toString() } as const;
    } catch {
        return { ok: false, error: "Informe um link de deck valido." } as const;
    }
}

export function isTicketOrderCardTypeInput(value: string): value is TicketOrderCardTypeInput {
    return value === "photo-laminated" || value === "foil-card";
}

export function formatTicketOrderCardType(cardType: TicketOrderCardTypeInput): string {
    return cardType === "foil-card" ? "Foil" : "Plastificada";
}

export function toPrismaTicketOrderCardType(cardType: TicketOrderCardTypeInput) {
    return cardType === "foil-card" ? "FOIL_CARD" : "PHOTO_LAMINATED";
}

export function fromPrismaTicketOrderCardType(cardType: string | null): TicketOrderCardTypeInput | null {
    if (cardType === "FOIL_CARD") {
        return "foil-card";
    }
    if (cardType === "PHOTO_LAMINATED") {
        return "photo-laminated";
    }

    return null;
}

function sanitizeTicketNickname(nickname: string): string {
    const sanitized = nickname
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "")
        .replace(/[|`]/g, "")
        .replace(/[\x00-\x1F\x7F]/g, "")
        .slice(0, 40);

    return sanitized || "usuario";
}
