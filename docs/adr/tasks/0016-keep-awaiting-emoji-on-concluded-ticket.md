# Keep Awaiting Emoji On Concluded Ticket Tasks

## Implementation

- [x] Review current `ticket/deliver` responder behavior.
- [x] Ensure awaiting-delivery channels use the `✅` prefix.
- [x] Remove the concluded-channel rename from `ticket/deliver`.
- [x] Confirm no channel name helper became unused.
- [x] Keep `CONCLUDED` status update on delivery.
- [x] Keep customer permission removal on delivery.
- [x] Keep existing 24-hour concluded order cleanup.

## Validation

- [x] Run `npm run check`.
- [x] Run `npm run build`.
- [ ] Manually verify clicking `Concluir pedido` does not change the channel emoji from `✅`.
- [ ] Manually verify clicking `Concluir pedido` hides the channel from the customer.
- [ ] Manually verify concluded tickets are still eligible for deletion after 24 hours.
