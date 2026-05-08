# Manual PIX Payment Fallback Tasks

## Implementation

- [x] Add `PaymentMethod` enum to `prisma/models/ticketOrder.prisma`.
- [x] Add `paymentMethod` field to `TicketOrder`.
- [x] Add `fallbackPixKey` field to `GuildBotConfig`.
- [x] Regenerate Prisma Client.
- [x] Add `fallbackPixKey` to config view/update types.
- [x] Add a payment config page to `/config`.
- [x] Add modal and responders for editing the fallback PIX key.
- [x] Add fallback PIX payment embed with manual instructions and confirmation button.
- [x] Add "Usar PIX Manual" button to the order review screen.
- [x] Modify Mercado Pago confirmation to automatically fall back to manual PIX when configured.
- [x] Add manual payment confirmation responder.
- [x] Reuse the standard post-payment flow after manual confirmation.
- [x] Persist `paymentMethod` for Mercado Pago and manual payments.

## Validation

- [x] Run `npm run check`.
- [x] Run `npm run build`.
- [ ] Manually verify `/config` can save a fallback PIX key.
- [ ] Manually verify "Usar PIX Manual" sends the manual PIX embed.
- [ ] Manually verify Mercado Pago failure falls back to manual PIX when configured.
- [ ] Manually verify missing fallback PIX key shows a clear error.
- [ ] Manually verify "Confirmar Pagamento" moves the ticket to awaiting delivery.
