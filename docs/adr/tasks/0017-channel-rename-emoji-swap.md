# Channel Rename Emoji Swap Tasks

## Implementation

- [x] Update `ticketChannelPrefixes` in `ticket-order.ts`: change `awaiting` to ✏️ and `concluded` to ✅.
- [x] Add `replaceChannelStageEmoji()` to `ticket-order.ts`.
- [x] Replace pending payment channel renames in `buttons.ts` with `replaceChannelStageEmoji(channel.name, "pending")`.
- [x] Replace awaiting delivery channel rename in `payment-approval.ts` with `replaceChannelStageEmoji(channel.name, "awaiting")`.
- [x] Replace concluded channel rename in `buttons.ts` with `replaceChannelStageEmoji(channel.name, "concluded")`.
- [x] Delete `formatConcludedChannelName()` from `buttons.ts`.
- [x] Keep `formatTicketChannelName()` for initial channel creation only.

## Validation

- [x] Run `npm run check`.
- [x] Run `npm run build`.
- [ ] Manually verify ticket creation still uses ⌛ prefix with date.
- [ ] Manually verify confirm payment setup changes only emoji to 🛒.
- [ ] Manually verify payment approved changes only emoji to ✏️.
- [ ] Manually verify concluded changes only emoji to ✅.
- [ ] Manually verify date in channel name does not change across stage transitions.
