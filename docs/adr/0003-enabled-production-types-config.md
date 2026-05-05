# Enabled Production Types Config

## Status
Accepted

## Context
The bot will later let customers choose which kind of proxy production they want to buy. Admins need to control which production types are currently available without changing material cost settings.

The initial production types are `Papel fotografico plastificado` and `Papel adesivo holografico em cartao (Foil)`.

## Decision
Add a dedicated `/config` page named `Tipos de confeccao` with one toggle button for each production type.

Store the enabled state per guild in `GuildBotConfig` as boolean fields defaulting to `true`, so existing guilds start with both options available after deployment.

At least one production type must remain enabled. If an admin tries to disable the last enabled type, the bot keeps the existing state and updates the panel with a warning.

## Consequences
The future customer order flow can read these booleans to decide which production options to display.

Keeping this as a separate config page avoids mixing availability controls with material package pricing pages.
