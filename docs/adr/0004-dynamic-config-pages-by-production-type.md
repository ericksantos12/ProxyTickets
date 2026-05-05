# Dynamic Config Pages By Production Type

## Status
Accepted

## Context
The config panel now has production type toggles for `Papel fotografico plastificado` and `Papel adesivo holografico em cartao (Foil)`. The material pricing pages should follow those enabled production types so admins only see pricing pages that matter for currently available products.

The current pricing pages split printing paper and lamination into separate pages, while foil already groups its two materials on one page. The photographic laminated option also uses two materials together: printing paper and lamination sheets.

## Decision
Move `Tipos de confeccao` to the first config page and make pricing pages dynamic based on enabled production types.

The photographic laminated pricing page will group `Folhas de impressao` and `Folhas de plastificacao` into a single page. The foil pricing page will continue grouping `Papel adesivo holografico` and `Papel cartao`.

If `Papel fotografico plastificado` is disabled, hide the photographic laminated pricing page. If `Foil` is disabled, hide the foil pricing page. The production type page remains always visible and the existing rule requiring at least one enabled production type remains in force.

## Consequences
The config panel navigation must calculate visible pages from the current guild config instead of relying on a static page list.

Old or stale component custom IDs may reference pages that are no longer visible after a toggle. In that case, handlers should render the nearest valid page, preferably `Tipos de confeccao`, instead of failing.

This change does not require new database fields because it reuses the production enabled booleans and existing material pricing fields.
