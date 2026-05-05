# Ticket Panel Command

## Status
Accepted

## Context
The target bot flow starts with an admin posting a ticket entry message. Users will later click a button to create a private ticket, but the button behavior is intentionally out of scope for this feature.

## Decision
Add an admin-only `/ticket` command that posts a public embed in the current channel with a single `Criar ticket` button.

The command requires `ManageGuild` because it creates a public server-facing ticket entry point. The button uses custom ID `ticket/create`, reserved for a future responder feature.

## Consequences
This feature creates the visible ticket entry panel without introducing ticket lifecycle logic yet. Clicking the button may show an interaction failure until the future responder is implemented.
