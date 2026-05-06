# Mercado Pago Orders API

## Status
Accepted

## Context
The current Mercado Pago PIX integration creates payments through the Payments API (`/v1/payments`). This works for PIX QR code generation, but sandbox validation requires a valid test buyer email and currently rejects generated Discord placeholder emails with `2198 - Invalid test user email`.

Mercado Pago now recommends the Orders API (`/v1/orders`) for new Checkout Transparente integrations. Orders API supports PIX QR code creation, returns the QR code data needed by the bot, and provides a documented sandbox flow where `payer.first_name = "APRO"` can automatically approve test PIX orders.

The bot only needs to create one PIX charge per ticket order, show the QR code/copia-e-cola in Discord, poll Mercado Pago until payment is approved or expired, then move the ticket to delivery handling. Orders API supports this workflow while aligning the integration with Mercado Pago's current direction.

## Decision
Migrate Mercado Pago PIX creation and polling from Payments API to Orders API.

When an admin confirms a ticket, the bot will create a Mercado Pago order with:

- `type: "online"`
- `processing_mode: "automatic"`
- one PIX payment transaction with `payment_method.id: "pix"` and `payment_method.type: "bank_transfer"`
- a 30-minute expiration
- a ticket-specific external reference

The existing database field `paymentId` will continue to store the external Mercado Pago identifier, but after this migration it will store the Orders API order ID instead of the Payments API payment ID. The field is already a string, so no schema change is required for the ID format change.

The Mercado Pago wrapper will preserve the existing bot-facing function names where practical (`createPixPayment`, `getPayment`, `cancelPayment`) to minimize changes outside the integration boundary, but those functions will use Orders API internally.

## Sandbox Behavior
For sandbox mode, the request will send a valid test payer shape accepted by Orders API. The bot will support `MP_TEST_PAYER_EMAIL`, defaulting to Mercado Pago's documented `test@testuser.com` when unset.

When `MP_SANDBOX=true`, the request may use `payer.first_name: "APRO"` so the test order can progress to approved automatically according to Mercado Pago's sandbox documentation.

## Production Behavior
For production mode, the bot will still send a syntactically valid payer email. If Discord does not provide a real email, the integration may keep using a deterministic placeholder email derived from the Discord user ID unless Mercado Pago production validation requires a real customer email later.

## Consequences
The bot will align with Mercado Pago's recommended API for new Checkout Transparente integrations and avoid the current sandbox email validation blocker.

Polling and cancellation must read Orders API response structures instead of Payments API response structures. QR code data moves from `point_of_interaction.transaction_data` to the first payment transaction's `payment_method` data.

Existing pending tickets created with the old Payments API may not be compatible with the new Orders API polling and cancellation methods. This is acceptable during development, but any live pending payments should be resolved before deploying the migration.

The Mercado Pago dashboard integration product should be configured as Checkout Transparente with API Orders.
