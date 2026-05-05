# 0006 - Ticket Category Config Tasks

## Implementation

- [x] Create ADR `docs/adr/0006-ticket-category-config.md`.
- [x] Create this task file.
- [x] Add nullable category ID fields to `GuildBotConfig`.
- [x] Apply schema to the development database.
- [x] Regenerate the Prisma Client.
- [x] Add `Categorias de tickets` as an always-visible `/config` page.
- [x] Render current category state for `Tickets Novos`, `Pendentes`, and `Aguardando`.
- [x] Use category-only channel selects for each ticket category role.
- [x] Save selected category immediately.
- [x] Reject duplicate category assignments with a warning and no persistence.
- [x] Show `Categoria nao encontrada` for saved category IDs that no longer resolve in Discord.
- [x] Preserve `ManageGuild` permissions.
- [x] Do not implement the `ticket/create` button responder in this feature.
- [x] Do not block `/ticket` panel posting when categories are incomplete.

## Validation

- [x] Run `npm run check`.
- [x] Run `npm run build`.
