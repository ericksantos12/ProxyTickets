# Bot Configuration Panel

## Status
Accepted

## Context
The bot needs an administrative configuration flow for pricing inputs used by future order calculations. The first editable settings are the package price and sheet count for printing paper and lamination sheets, with the unit price calculated from those values.

The configuration UI should be general enough to grow into more bot settings later, but this feature must remain limited to the configuration panel and price display. Ticket, order, and PIX integration are intentionally out of scope for this ADR.

## Decision
Create an ephemeral `/config` administrative panel using Discord Components V2, with domain-based pages and contextual editing through modals.

The initial pages are `Folhas de impressao` and `Folhas de plastificacao`. Each page shows package price, package sheet count, and calculated unit price. Navigation uses `Anterior` and `Proximo` buttons with invalid extremes disabled. Editing uses one contextual `Editar` button for the current page. The panel also has a `Fechar` button that replaces the panel with `Painel fechado.` and removes components.

Only members with `ManageGuild` can open or modify the panel. Configuration is stored per guild in a separate `GuildBotConfig` model related to `Guild`. Monetary values are stored as integer cents, quantities are stored as positive integers, and nullable fields represent `Nao configurado`.

The unit price is calculated at runtime from package price divided by package quantity. Internal calculations keep precision until display, while the panel displays monetary values with two decimal places.

## Input Rules
Price inputs accept comma or point decimal separators and common BR/US thousands separators, but do not accept an `R$` prefix. Prices must be greater than zero and within a generous operational maximum.

Quantity inputs must be integers greater than or equal to one and within a generous operational maximum.

Existing values should prefill the edit modal when available. Invalid modal submissions should return an ephemeral error and leave persisted settings unchanged.

## Consequences
The panel is private and temporary, so admins run `/config` whenever they need to inspect or change settings. This avoids a persistent public configuration message and keeps administrative edits private.

The separate `GuildBotConfig` model keeps the existing `Guild` model focused on server identity and relationships while allowing bot settings to grow in a typed way.

Prisma schema changes require regenerating the versioned Prisma Client. For this project, schema application should use `.env.dev` with `prisma db push -- --dev` when implementation begins.

## Follow-Up Scope
Future ADRs should cover using these configuration values in ticket order pricing, payment generation, and admin order handling.
