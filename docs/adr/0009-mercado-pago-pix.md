# Mercado Pago PIX Payment Integration

## Status
Accepted

## Context
The bot currently generates a mock PIX code when an admin confirms a ticket. Real payment handling, QR code generation, and automatic confirmation are missing. The next step is to integrate Mercado Pago's PIX API so the bot can generate a real QR code and "copia e cola" string, receive webhook notifications when the payment is confirmed, and move the ticket channel to the awaiting-delivery category automatically.

## Decision
Integrate Mercado Pago PIX using the official `mercadopago/sdk-node` package.

### Authentication
- Use a long-lived **Access Token** (sandbox for development, production for live).
- Store `MP_ACCESS_TOKEN` in `.env`.

### Payment Creation
When an admin clicks **Confirmar pedido** (`ticket/confirm`):
- Create a Mercado Pago payment via SDK with `transaction_amount`, `description`, and `payment_method_id: "pix"`.
- Set expiration to **30 minutes**.
- Persist the Mercado Pago `paymentId`, `paymentStatus`, `paymentQrCodeBase64`, `paymentCopyPaste`, and `paymentExpiresAt` in the `TicketOrder` record.
- Render the QR code image as an attachment in the channel embed and include the "copia e cola" string.

### Webhook
- Run a lightweight **Express** server inside the same Node process on a separate port (`WEBHOOK_PORT`, default 3001).
- Expose a single POST endpoint `/webhooks/mercado-pago`.
- Validate the Mercado Pago webhook signature (`x-signature`) using `MP_WEBHOOK_SECRET`.
- On `payment.updated` with status `approved`:
  - Update the ticket status to `AWAITING_DELIVERY` and set `paidAt`.
  - Move the channel to the configured `awaitingDeliveryCategoryId`.
  - Rename the channel with the awaiting-delivery prefix.
  - Reapply the ticket owner permissions.
  - Edit the payment message to show confirmation.

### Expiration Handling
- If the PIX expires without payment:
  - Cancel the payment in Mercado Pago.
  - Update the ticket status to `CANCELLED` with `cancelledAt`.
  - Delete the ticket channel after a short countdown (similar to `/fechar`).

### Environment Variables
New required/optional env vars:
- `MP_ACCESS_TOKEN` (required)
- `MP_WEBHOOK_SECRET` (required for signature validation)
- `WEBHOOK_BASE_URL` (required, public URL for Mercado Pago to call)
- `WEBHOOK_PORT` (optional, defaults to 3001)

### Schema Changes
Add to `TicketOrder`:
- `paymentId: String?`
- `paymentStatus: String?`
- `paymentQrCodeBase64: String?`
- `paymentCopyPaste: String?`
- `paymentExpiresAt: DateTime?`
- `paidAt: DateTime?`

Add to `TicketOrderStatus` enum:
- `AWAITING_DELIVERY`

## Consequences
The bot will handle real PIX payments end-to-end, eliminating the mock payment step. Admins and users get an automated flow from order confirmation through payment to delivery tracking. The webhook server adds an open port requirement and a public URL for receiving Mercado Pago callbacks.
