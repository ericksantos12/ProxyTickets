# Ticket Notifications Config Tasks

## Implementation

- [x] Add `notificationChannelId` and `notificationRoleIds` to `GuildBotConfig`.
- [x] Regenerate Prisma Client.
- [x] Add notification fields to config view/update types.
- [x] Add `notifications` page to `/config`.
- [x] Add text channel select for notification channel.
- [x] Add multi-role select for notification roles.
- [x] Add config responders to persist notification channel and roles.
- [x] Create shared ticket notification helper with styled containers.
- [x] Send new-ticket notification mentioning configured roles.
- [x] Send order-details notification mentioning only the responsible admin when present.
- [x] Send payment-confirmed notification mentioning only the responsible admin when present.

## Validation

- [x] Run `npx prisma generate`.
- [x] Run `npm run check`.
- [x] Run `npm run build`.
- [ ] Manually verify `/config` saves notification channel.
- [ ] Manually verify `/config` saves notification roles.
- [ ] Manually verify new-ticket notification mentions configured roles.
- [ ] Manually verify order-details notification mentions only the responsible admin when present.
- [ ] Manually verify payment-confirmed notification mentions only the responsible admin when present.
