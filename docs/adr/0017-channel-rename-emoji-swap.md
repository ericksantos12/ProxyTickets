# Channel Rename Emoji Swap

## Status
Proposed

## Context
When a ticket order changes stage, the bot currently renames the channel using `formatTicketChannelName()` in most transitions. That function regenerates the whole channel name, including the date, so the date can shift to the day of each stage transition instead of staying as the original ticket date.

The concluded transition uses `formatConcludedChannelName()` in `buttons.ts`, which parses the current channel name by splitting on `│` and replacing the prefix. That preserves the date, but only for one transition and with duplicated name-format knowledge outside `ticket-order.ts`.

The stage emojis also need to change:

- `awaiting` changes from ✅ to ✏️.
- `concluded` changes from 🚛 to ✅.

## Decision
Add a shared `replaceChannelStageEmoji(currentName, stage)` helper next to `formatTicketChannelName()` in `ticket-order.ts`.

The helper will replace only the known stage emoji prefix and preserve the rest of the channel name exactly as-is, including username and date. `formatTicketChannelName()` remains responsible for the initial ticket channel name.

Stage emojis will become:

| Stage | Emoji |
| --- | --- |
| `new` | ⌛ |
| `pending` | 🛒 |
| `awaiting` | ✏️ |
| `concluded` | ✅ |

Use `replaceChannelStageEmoji()` for all stage renames after channel creation, including pending payment, awaiting delivery, and concluded.

Delete the local `formatConcludedChannelName()` helper from `buttons.ts` after the shared helper replaces it.

## Alternatives Considered

### Continue using `formatTicketChannelName()` for transitions
- **Pros**: Simple and already available.
- **Cons**: Regenerates the date on each transition.
- **Why not**: The channel date should stay stable after creation.

### Keep `formatConcludedChannelName()` only for concluded tickets
- **Pros**: Minimal change for the reported concluded rename issue.
- **Cons**: Keeps inconsistent behavior where only one transition preserves the date.
- **Why not**: All stage renames should follow one rule.

### Store the original channel date in the database
- **Pros**: Avoids parsing channel names.
- **Cons**: Adds schema/state for data already present in the channel name.
- **Why not**: Emoji-only replacement is smaller and sufficient.

## Consequences

### Positive
- Channel date remains unchanged across stage transitions.
- Stage rename logic is centralized in `ticket-order.ts`.
- Concluded tickets use the requested ✅ emoji.
- Awaiting delivery tickets use the requested ✏️ emoji.

### Negative
- The emoji replacement helper must know all stage prefixes.

### Risks
- If a channel name is manually edited and no longer starts with a known stage emoji, the helper should leave it unchanged or fall back safely. In that case, the stage emoji may not update until the name is corrected.
