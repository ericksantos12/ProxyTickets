# Mercado Pago Payment Polling

## Status
Accepted

## Context
ADR 0009 introduced Mercado Pago PIX payments using an embedded Express webhook server to receive payment confirmations. This requires a public webhook endpoint, webhook signature configuration, and the `express` runtime dependency.

For this bot, payment volume is expected to be low. Mercado Pago API rate limits are high enough for periodic polling of pending payments. Polling removes the need for an HTTP server, public webhook routing, and webhook-specific environment variables while keeping the payment lifecycle automated.

## Decision
Replace Mercado Pago webhook confirmation with a polling loop that runs inside the Discord bot process.

The polling loop will run every 30 seconds and query only tickets with `TicketOrder.status = PENDING_PAYMENT` and a stored `paymentId`.

For each pending payment:

- Fetch the current Mercado Pago payment status via `getPayment(paymentId)`.
- If the payment is approved:
  - Update the order to `AWAITING_DELIVERY`.
  - Store the latest `paymentStatus` and `paidAt`.
  - Move the ticket channel to the configured `Aguardando` category.
  - Rename the channel with the awaiting-delivery prefix.
  - Reapply ticket owner permissions.
  - Notify the ticket channel that payment was confirmed.
- If the payment expired:
  - Cancel the payment in Mercado Pago when possible.
  - Update the order to `CANCELLED` and set `cancelledAt`.
  - Notify the ticket channel and delete it after a short countdown.
- Otherwise, persist the latest Mercado Pago payment status and keep waiting.

Remove the webhook server and webhook-specific configuration:

- Delete `src/server/webhook.ts`.
- Delete `src/discord/events/webhook-start.ts`.
- Remove `express` and `@types/express` dependencies.
- Remove `MP_WEBHOOK_SECRET` and `WEBHOOK_PORT` from env validation and `.env.example`.

## Consequences
The bot no longer needs a public webhook endpoint or an embedded Express server. Payment confirmation may take up to 30 seconds after approval, which is acceptable for this ticket workflow.

Polling depends on the bot process staying online. If the bot restarts, the next polling cycle resumes by reading pending payments from the database.
