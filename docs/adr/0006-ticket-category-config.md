# Ticket Category Config

## Status
Accepted

## Context
The future ticket lifecycle needs three Discord category channels controlled by admins instead of hard-coded category names. Admins will create the categories in Discord and map each lifecycle stage in `/config`.

The required stages are `Tickets Novos`, `Pendentes`, and `Aguardando`.

## Decision
Add a dedicated `/config` page named `Categorias de tickets` where admins can choose one Discord category for each ticket lifecycle stage.

The page uses category-only channel selects. Selection saves immediately. The three configured categories must be distinct; if an admin selects a category already assigned to another stage, the bot keeps the existing configuration and shows a warning.

The configured category IDs are stored per guild in `GuildBotConfig` as `newTicketsCategoryId`, `pendingPaymentCategoryId`, and `awaitingDeliveryCategoryId`.

## Consequences
The future ticket creation button can use `newTicketsCategoryId` to create new ticket channels, while future payment/order steps can move channels into the pending and awaiting categories.

The existing `/ticket` panel command should not be blocked by incomplete category configuration in this feature. Enforcement belongs to the future ticket creation feature.

If a configured category is deleted in Discord, the config panel should show `Categoria nao encontrada` and allow admins to choose another category.
