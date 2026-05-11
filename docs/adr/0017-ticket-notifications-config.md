# Ticket Notifications Config

## Status
Accepted

## Context
Admins need a centralized notification feed for important ticket events instead of relying only on activity inside each temporary ticket channel. The bot currently has no configurable notification channel and no way to mention operational roles when new work appears.

Notifications should be visible and readable, so they should use the bot's existing component/embed visual language instead of plain text. Different events need different mention behavior: new tickets should notify configured roles, while later order-specific updates should notify only the responsible admin.

## Decision
Add notification settings to `/config`:

- `notificationChannelId`: text channel where ticket notifications are sent.
- `notificationRoleIds`: roles mentioned when a new ticket is created.

The bot will send styled notification messages for:

- **New ticket**: mention configured roles and include customer/channel details.
- **Pedido preenchido**: mention only the responsible admin when one exists and include order details.
- **Pagamento confirmado**: mention only the responsible admin and include payment/order details.

Notification messages will use Components V2 containers to match the rest of the bot UI. Mentions will stay in message `content` so Discord reliably pings roles/users while the details remain in the visual container.

## Alternatives Considered

### Plain text notifications
- **Pros**: Simpler to implement and easy to scan in mobile notifications.
- **Cons**: Less readable in the notification channel and inconsistent with the bot's UI style.
- **Why not**: The user requested a polished embed-style notification.

### Mention roles for every notification
- **Pros**: More people see all updates.
- **Cons**: Noisy after a ticket is already assigned.
- **Why not**: The requested behavior is roles only for new tickets; order updates mention only the responsible admin.

### Add clearing buttons for notification settings
- **Pros**: Allows disabling notification settings from the UI.
- **Cons**: Adds extra controls not currently needed.
- **Why not**: The user said clearing is not required.

## Consequences

### Positive
- Admins get a single notification feed for new tickets and important order progress.
- Role pings are limited to new tickets, reducing noise.
- Responsible admins get direct pings for updates that need their attention.

### Negative
- Adds new schema fields and generated Prisma Client changes.
- Notification delivery can fail if the configured channel is deleted or permissions are missing.

### Risks
- If the notification channel is not configured, no notification is sent. This is acceptable because notifications are opt-in config.
- If no responsible admin exists when order details are submitted, the notification is sent without a mention.
