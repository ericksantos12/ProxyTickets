# Manual PIX Payment Fallback

## Status
Accepted

## Context
When an admin confirms a ticket order, the bot calls the Mercado Pago Orders API to generate a PIX QR code and copy-paste code. If the API is down, rate-limited, or returns an error, the order stays stuck in IN_REVIEW with only an ephemeral error message. The admin must retry the "Confirmar pedido" button later, and the user has no way to proceed.

Additionally, there are legitimate situations where an admin may prefer to receive payment manually, such as testing, API instability, or business preference, rather than through the automated Mercado Pago flow.

## Decision
Add a manual PIX payment fallback that activates in two scenarios:

- **Automatic fallback**: when `createPixPayment()` fails, if a `fallbackPixKey` is configured in the guild's bot config, proceed with manual payment instead of showing only an error.
- **Opt-in manual**: add a "Usar PIX Manual" button to the order review screen alongside "Confirmar pedido", allowing the admin to choose manual PIX even when the Mercado Pago API is available.

The manual flow shows an embed with the guild's configured PIX key as plain text, the order total, and instructions to pay manually and send the receipt in the ticket channel. The embed includes a "Confirmar Pagamento" button that only the responsible admin can use; when clicked, it advances the order through the standard post-payment flow.

Add a `PaymentMethod` enum field to `TicketOrder` (`MERCADO_PAGO` | `MANUAL`) so the polling loop and future flows can distinguish between automated and manual payments.

Add `fallbackPixKey` to `GuildBotConfig` so each guild can configure its own PIX key via `/config`.

## Alternatives Considered

### Retry-only approach
- **Pros**: Simpler implementation, no additional configuration.
- **Cons**: Admin and user remain blocked when Mercado Pago is down.
- **Why not**: The required behavior is to keep orders flowing with a manual fallback.

### Fallback without opt-in manual button
- **Pros**: Less UI complexity.
- **Cons**: Admin cannot choose manual PIX when Mercado Pago works but manual payment is preferred.
- **Why not**: The user requested both automatic fallback and an explicit manual option.

### Static fallback PIX QR code image
- **Pros**: User can scan a visual QR code.
- **Cons**: Requires storing an image or generating one from a static key.
- **Why not**: The requested configuration is a plain text PIX key.

## Consequences

### Positive
- Orders can proceed when Mercado Pago is unavailable.
- Admins can intentionally choose manual PIX.
- The fallback PIX key is configurable per guild.
- Payment method is explicit in persisted order data.

### Negative
- Adds schema, config UI, and responder code.
- Manual confirmation depends on admin validation of the receipt.

### Risks
- If `fallbackPixKey` is not configured and Mercado Pago fails, the order still cannot proceed. The bot must show a clear configuration error.
- Manual payments are not automatically detected. Only the responsible admin can confirm the fallback payment.
