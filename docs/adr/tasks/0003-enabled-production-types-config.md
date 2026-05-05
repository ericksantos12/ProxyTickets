# 0003 - Enabled Production Types Config Tasks

## Implementation

- [x] Create ADR `docs/adr/0003-enabled-production-types-config.md`.
- [x] Create this task file.
- [x] Add production type enabled booleans to `GuildBotConfig`.
- [x] Apply schema to the development database.
- [x] Regenerate the Prisma Client.
- [x] Add `Tipos de confeccao` page to the config panel.
- [x] Add toggle buttons for `Papel fotografico plastificado` and `Papel adesivo holografico em cartao (Foil)`.
- [x] Enforce at least one production type remaining enabled.
- [x] Preserve `ManageGuild` permissions.

## Validation

- [x] Run `npm run check`.
- [x] Run `npm run build`.
