# 0005 - Ticket Panel Command Tasks

## Implementation

- [x] Create ADR `docs/adr/0005-ticket-panel-command.md`.
- [x] Create this task file.
- [x] Add admin command `/ticket` under `src/discord/commands/admin`.
- [x] Require `ManageGuild` permission for the command.
- [x] Send a public Components V2 ticket panel in the current channel.
- [x] Add a single `Criar ticket` button with custom ID `ticket/create`.
- [x] Do not implement the button responder in this feature.

## Validation

- [x] Run `npm run check`.
- [x] Run `npm run build`.
