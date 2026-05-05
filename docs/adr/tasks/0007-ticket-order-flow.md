# 0007 - Ticket Order Flow Tasks

## Setup

- [x] Create ADR `docs/adr/0007-ticket-order-flow.md`.
- [x] Create this task file.

## Phase 1 - Persistence And Pricing Foundation

- [x] Add profit margin percentage to `GuildBotConfig`.
- [x] Add a persisted ticket/order model for the ticket lifecycle.
- [x] Apply schema to the development database.
- [x] Regenerate the Prisma Client.
- [x] Add price calculation helpers for card order totals using 8 cards per A4 sheet and whole-sheet rounding.

## Phase 1 Validation

- [x] Run `npm run check`.
- [x] Run `npm run build`.

## Phase 2 - Profit Margin Config

- [x] Add profit margin editing to `/config`.
- [x] Show the current profit margin in the config panel.
- [x] Validate profit margin input as a percentage greater than or equal to 0.

## Phase 2 Validation

- [x] Run `npm run check`.
- [x] Run `npm run build`.
- [x] Manually verify `/config` can save the profit margin.

## Phase 3 - Ticket Channel Creation

- [x] Implement channel name formatting without spaces for new, pending, and awaiting states.
- [x] Implement `ticket/create` responder.
- [x] Require the configured `Tickets Novos` category before creating a ticket.
- [x] Create the ticket text channel under `Tickets Novos` and grant access to the requesting user.
- [x] Persist a new order when the channel is created.
- [x] Send the initial ticket message with actions to fill order details or give up.
- [x] Implement give-up confirmation, cancellation persistence, and channel deletion.

## Phase 3 Validation

- [x] Run `npm run check`.
- [x] Run `npm run build`.
- [x] Manually verify `Criar ticket` creates a channel under `Tickets Novos` with the expected no-space name format.
- [x] Manually verify `Desistir` asks for confirmation, cancels the order, and deletes the channel.

## Phase 4 - User Order Details

- [x] Implement order detail collection for card type, card count, and deck link.
- [x] Limit card type options to enabled production types.
- [x] Validate card count and optional deck link input.
- [x] Post `Pendencia de confirmacao` after the user submits order details.
- [x] Keep order detail collection in one ticket message to prevent spam.

## Phase 4 Validation

- [x] Run `npm run check`.
- [x] Run `npm run build`.
- [X] Manually verify the user can submit order details.
- [X] Manually verify closing the details modal keeps the card type select usable.
- [X] Manually verify card type options follow enabled production types.
- [X] Manually verify invalid card count and invalid provided deck link input are rejected.

## Phase 5 - Admin Assumption And Editing

- [x] Implement `Assumir pedido` for admins with `ManageGuild`.
- [x] Persist the responsible admin ID.
- [x] Show the submitted order summary after an admin assumes the ticket.
- [x] Allow the user to edit submitted order details before confirmation.

## Phase 5 Validation

- [x] Run `npm run check`.
- [x] Run `npm run build`.
- [x] Manually verify an admin with `ManageGuild` can assume the order.
- [x] Manually verify users without `ManageGuild` cannot assume the order.
- [x] Manually verify the user can edit submitted order details before confirmation.

## Phase 6 - Confirmation And PIX Mock

- [x] Implement `Confirmar pedido` for the responsible admin only.
- [x] Recalculate the final price when confirming the order.
- [x] Move the channel to `Pendentes` and rename it with the pending-payment format.
- [x] Post a mock PIX embed with final value and fake copy-and-paste code.
- [x] Make clear in the mock PIX embed that no real payment is generated.
- [x] Keep real PIX generation, payment detection, and awaiting-delivery transition out of scope.

## Phase 6 Validation

- [x] Run `npm run check`.
- [x] Run `npm run build`.
- [x] Manually verify only the responsible admin can confirm the order.
- [x] Manually verify confirmation moves the channel to `Pendentes`, renames it, and posts mock PIX.

## Final Validation

- [x] Run `npm run check`.
- [x] Run `npm run build`.
- [x] Manually verify the complete flow from `/ticket` panel to mock PIX.
- [x] Create a Conventional Commits commit for ADR 0007 after all phases pass.
