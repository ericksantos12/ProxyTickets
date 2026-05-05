# Ticket Close Command

## Status
Accepted

## Context
Admins need a fast way to close and cancel an existing ticket without going through the full ticket flow. Today the only cancellation path is the user-facing flow inside the ticket channel.

## Decision
Add an admin-only slash command `/fechar` that cancels a ticket immediately from the current channel. The command will:

- Require `ManageGuild` permission.
- Use the current channel as the ticket target.
- Verify the channel is a ticket by looking up `TicketOrder` via `channelId`.
- If found and not cancelled, set status to `CANCELLED`, set `cancelledAt`, send a 10-second countdown, and delete the channel.
- If the channel is not a ticket or already cancelled, reply with an ephemeral explanation and take no destructive action.

## Consequences
Admins can quickly clean up tickets without waiting for the user. The command is destructive (channel delete), so it is restricted to admins and provides clear confirmation/feedback.
