# 0004 - Dynamic Config Pages By Production Type Tasks

## Implementation

- [x] Create ADR `docs/adr/0004-dynamic-config-pages-by-production-type.md`.
- [x] Create this task file.
- [x] Move `Tipos de confeccao` to the first config page.
- [x] Replace static config panel navigation with visible pages derived from enabled production types.
- [x] Combine `Folhas de impressao` and `Folhas de plastificacao` into one photographic laminated pricing page.
- [x] Hide the photographic laminated pricing page when `Papel fotografico plastificado` is disabled.
- [x] Hide the foil pricing page when `Foil` is disabled.
- [x] Preserve the existing rule that at least one production type remains enabled.
- [x] Ensure stale or hidden page custom IDs render a valid visible page instead of failing.
- [x] Update modal save routing so lamination is saved as a section of the photographic laminated page.
- [x] Preserve `ManageGuild` permissions.

## Validation

- [x] Run `npm run check`.
- [x] Run `npm run build`.
