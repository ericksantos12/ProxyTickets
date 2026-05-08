# Sandbox Presence Status Tasks

## Implementation

- [x] Change `MP_SANDBOX` default to `false`.
- [x] Add a startup event that sets bot activity to `Modo Sandbox` when `MP_SANDBOX=true`.
- [x] Leave bot activity unchanged when `MP_SANDBOX=false`.

## Validation

- [x] Run `npm run check`.
- [x] Run `npm run build`.
- [ ] Manually verify `MP_SANDBOX=true` shows `Modo Sandbox` in Discord.
- [ ] Manually verify omitted or false `MP_SANDBOX` does not set sandbox activity.
