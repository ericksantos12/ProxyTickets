# 0002 - Foil Card Materials Config

## Status

Accepted

## Context

The bot configuration panel already lets admins configure package-based costs for proxy production inputs. Foil cards require two material inputs that combine into one card unit cost: holographic sticker paper and cardstock.

## Decision

Add a new `/config` panel page named `Cartas foil` using the existing Constatic command, menu, responder, and Components V2 patterns. The page will show package price, sheet count, calculated unit price, and edit controls for each material section.

The foil page will persist four nullable fields on `GuildBotConfig`:

- `holographicStickerPackPriceCents`
- `holographicStickerPackSheetCount`
- `cardstockPackPriceCents`
- `cardstockPackSheetCount`

The page will also show a combined unit cost when both material unit prices are configured.

## Consequences

Admins can configure foil card materials without changing the existing paper and lamination pages. Existing permission rules, button navigation, and modal save flow remain intact, with section-aware custom IDs only where the foil page needs them.
