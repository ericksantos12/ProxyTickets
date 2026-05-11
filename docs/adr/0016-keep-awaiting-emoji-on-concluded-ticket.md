# Keep Awaiting Emoji On Concluded Ticket

## Status
Accepted

## Context
The ticket delivery flow currently rewrites the channel stage when the responsible admin concludes an order. This creates an extra title mutation after the order is finished, but the desired operational behavior is simpler: once an order is paid and awaiting delivery, the channel should stay identified by the awaiting/preparation emoji (`✅`), be hidden from the customer on conclusion, and then be removed automatically after the existing 24-hour retention period.

The current implementation already removes the customer's channel permissions on conclusion and the cleanup loop already deletes concluded orders after 24 hours. The mismatch is the final channel rename.

## Decision
Stop renaming the ticket channel when the responsible admin clicks **Concluir pedido**.

The payment-confirmed/awaiting-delivery stage will use the `✅` prefix. The finalization flow will keep the channel name as-is, preserving that prefix. It will continue to mark the order as `CONCLUDED`, hide the channel from the customer, and rely on the existing concluded-order cleanup loop to delete the channel after 24 hours.

## Alternatives Considered

### Keep a separate concluded prefix
- **Pros**: Visually distinguishes delivered/concluded orders from awaiting-delivery orders.
- **Cons**: Adds an unnecessary final channel state and conflicts with the desired operational convention.
- **Why not**: The user explicitly requested no title change on conclusion and keeping the `✅` emoji.

### Add a new channel category for concluded orders
- **Pros**: Could separate concluded orders without changing the emoji.
- **Cons**: Adds more configuration and channel movement for a stage that is temporary and auto-deleted.
- **Why not**: The existing 24-hour cleanup is sufficient.

## Consequences

### Positive
- The final ticket channel name remains stable after payment confirmation.
- Customer visibility is removed without introducing another channel naming stage.
- Existing 24-hour cleanup behavior remains unchanged.

### Negative
- Admins cannot visually distinguish awaiting-delivery tickets from concluded-but-retained tickets by emoji alone.

### Risks
- Concluded tickets may look similar to awaiting-delivery tickets for up to 24 hours. The concluded message in the channel and missing customer permissions mitigate this.
