# Conclude Delivered Ticket

## Status
Accepted

## Context
After Mercado Pago confirms a PIX payment, the ticket order moves to `AWAITING_DELIVERY`, the channel is renamed with the check emoji, and the user keeps access while the admin prepares the order. There is currently no explicit action for the responsible admin to mark the order as produced and delivered.

Without a delivered state, completed channels stay visible to the customer and remain in Discord indefinitely unless manually deleted. The bot needs a reliable handoff from paid/preparing to delivered, while keeping a short admin-only retention window before automatic cleanup.

## Decision
Add a responsible-admin-only "Concluir pedido" action to the paid PIX confirmation message. When pressed, the bot will mark the order as concluded, rename the channel with a truck emoji, remove the ticket owner's access so the channel disappears for the customer, and keep the channel available to admins for 24 hours before automatic deletion.

The delivery completion state will be persisted with a new `CONCLUDED` ticket status and `concludedAt` timestamp. Automatic deletion will be driven by persisted state, not by an in-memory timer, so cleanup survives bot restarts.

## Alternatives Considered

### In-memory timer after button click

- **Pros**: Simple implementation with `setTimeout`.
- **Cons**: Timers are lost on bot restart or deploy.
- **Why not**: The retention window must survive process restarts.

### Delete channel immediately after conclusion

- **Pros**: No extra cleanup loop or retained channels.
- **Cons**: Admins lose short-term access to order history after marking delivery.
- **Why not**: The requested behavior is to keep the channel for one day.

### Move concluded tickets to a new category

- **Pros**: Cleaner operational separation for completed orders.
- **Cons**: Adds new configuration and setup complexity.
- **Why not**: The channel should remain in the current awaiting-delivery category; only the emoji/name and customer visibility change.

## Consequences

### Positive

- Admins get an explicit end-of-order action.
- Customers no longer see channels after the order is produced and delivered.
- Completed channels are cleaned automatically after a predictable retention period.
- Cleanup remains reliable across bot restarts because it is based on database timestamps.

### Negative

- The Prisma schema and generated client must change.
- The polling event gains another cleanup responsibility.
- Manual Discord verification is needed for permission removal and delayed deletion behavior.

### Risks

- If the bot lacks permission to delete permission overwrites, the channel may remain visible to the customer. The responder should catch and report Discord API failures where appropriate.
- If the bot is offline for more than 24 hours, deletion happens on the next polling cycle after restart, not exactly at the 24-hour mark.
