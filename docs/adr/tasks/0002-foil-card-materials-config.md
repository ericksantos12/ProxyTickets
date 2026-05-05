# 0002 - Foil Card Materials Config Tasks

## Implementation

- [x] Review existing config panel pages and responders.
- [x] Add foil material fields to `GuildBotConfig` schema.
- [x] Add `Cartas foil` page to the config panel.
- [x] Add separate edit buttons and modal handling for holographic sticker paper and cardstock.
- [x] Preserve existing paper and lamination page behavior.
- [x] Update generated Prisma client after schema changes.

## Validation

- [x] Run `PRISMA_ENV=dev npx prisma db push`.
- [x] Run `npm run check`.
- [x] Run `npm run build`.

## Notes

- `prisma db push --skip-generate` confirms the `proxy-tickets` database is in sync with the Prisma schema.
- The generated TypeScript client includes the foil material fields. A later standalone `prisma generate` still hit a Windows `EPERM` while replacing `query_engine-windows.dll.node`, which indicates a local file lock on the query engine binary rather than a schema/type failure.
