# Conclude Delivered Ticket Tasks

## Implementation

- [x] Add `CONCLUDED` to `TicketOrderStatus` in `prisma/models/ticketOrder.prisma`.
- [x] Add `concludedAt DateTime?` to `TicketOrder` in `prisma/models/ticketOrder.prisma`.
- [x] Regenerate Prisma Client after schema changes.
- [x] Update generated Prisma model/types committed in `src/database/prisma`.
- [x] Add a `concluded` ticket channel stage with truck emoji in `src/functions/ticket-order.ts`.
- [x] Add a shared helper to remove ticket owner permissions from a ticket channel.
- [x] Update the paid PIX confirmation render to include a `Concluir pedido` button for delivery completion.
- [x] Add a concluded-order render that removes the button and shows the delivered state.
- [x] Pass `responsibleAdminId` into the paid PIX confirmation render from payment polling.
- [x] Add a `ticket/deliver` responder that only allows the responsible admin to conclude `AWAITING_DELIVERY` orders.
- [x] In `ticket/deliver`, update the order to `CONCLUDED` with `concludedAt`, rename the channel to the truck stage, remove customer channel access, and edit the confirmation message.
- [x] Add automatic cleanup for `CONCLUDED` orders older than 24 hours, with a brief channel message before deletion.

## Validation

- [x] Run `npx prisma generate`.
- [x] Run `npx prisma db push`.
- [x] Run `npm run check`.
- [x] Run `npm run build`.
- [ ] Manually verify payment confirmation shows the `Concluir pedido` button.
- [ ] Manually verify only the responsible admin can conclude the order.
- [ ] Manually verify concluding changes the channel emoji to truck and removes the customer's channel access.
- [ ] Manually verify the concluded embed no longer has the button.
- [ ] Manually verify concluded channels are deleted after the retention threshold, or with a temporarily shortened threshold in development.
