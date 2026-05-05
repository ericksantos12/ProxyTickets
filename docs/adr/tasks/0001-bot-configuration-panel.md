# Tasks: Bot Configuration Panel

## Status
Implementation complete.

## Ground Rules
- Consult this file before and during implementation of ADR `0001-bot-configuration-panel.md`.
- Update checkboxes as implementation progresses.
- Do not include manual Discord verification as a required task for this feature.

## Documentation
- [x] Record the repository rule for ADRs and feature task files in `AGENTS.md`.
- [x] Create ADR `docs/adr/0001-bot-configuration-panel.md`.
- [x] Create this task file at `docs/adr/tasks/0001-bot-configuration-panel.md`.

## Implementation
- [x] Add a `GuildBotConfig` Prisma model related to `Guild`.
- [x] Add nullable integer fields for printing paper package price cents and sheet count.
- [x] Add nullable integer fields for lamination sheet package price cents and sheet count.
- [x] Include timestamps in `GuildBotConfig`.
- [x] Regenerate the versioned Prisma Client.
- [x] Apply the schema to the development database with `.env.dev`.
- [x] Add pricing helpers for parsing price input, parsing quantity input, formatting BRL, and calculating unit price.
- [x] Add a Components V2 renderer for the `/config` panel.
- [x] Add the `/config` command under `src/discord/commands/admin`.
- [x] Restrict command execution to members with `ManageGuild`.
- [x] Add config button responders under `src/discord/responders/config` for previous page, next page, edit, and close.
- [x] Add a config modal responder under `src/discord/responders/config` using `ResponderType.ModalComponent`.
- [x] Ensure modal submissions update only the selected config section.
- [x] Ensure invalid input returns an ephemeral error and does not persist changes.
- [x] Ensure unauthorized interactions return an ephemeral permission error.

## Validation
- [x] Run `npm run check`.
- [x] Run `npm run build`.
