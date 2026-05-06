# Mercado Pago Orders API Tasks

## Implementation

- [x] Review current Mercado Pago payment wrapper and Orders SDK response types.
- [x] Replace internal Payments API usage in `src/lib/mercado-pago.ts` with Orders API usage.
- [x] Map Orders API create response into the existing bot payment result shape.
- [x] Map Orders API get response into a status shape usable by payment polling.
- [x] Map Orders API cancellation through `Order.cancel()`.
- [x] Add `MP_TEST_PAYER_EMAIL` env validation with a safe sandbox default.
- [x] Update `.env.example` and `README.md` with Orders API and sandbox payer details.
- [x] Update ticket confirmation flow if needed for sandbox/production payer selection.
- [x] Update payment polling to use the normalized Orders API status response.
- [x] Improve Mercado Pago error messages for Orders API sandbox validation failures.

## Validation

- [x] Run `npm run check`.
- [x] Run `npm run build`.
- [ ] Manually create a Discord ticket and confirm it with `MP_SANDBOX=true`.
- [ ] Verify the bot renders the PIX QR code image and copia-e-cola string.
- [ ] Verify polling moves the ticket to awaiting delivery after sandbox approval.
- [ ] Verify expired pending orders are cancelled and the ticket channel is closed.
- [ ] Commit the implemented ADR using a Conventional Commits message.
