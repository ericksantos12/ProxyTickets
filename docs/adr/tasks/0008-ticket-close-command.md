# Task: Ticket Close Command

- [x] Review requirements and confirm `/fechar` behavior (cancel + delete).
- [x] Implement admin-only `/fechar` command using the current channel.
- [x] Validate ticket existence via `TicketOrder` by `channelId`.
- [x] Update ticket status to `CANCELLED` and set `cancelledAt`.
- [x] Delete the channel after updating status.
- [x] Reply with clear ephemeral feedback and countdown before deletion.
- [ ] Manual validation in Discord (ticket, non-ticket, already cancelled).
