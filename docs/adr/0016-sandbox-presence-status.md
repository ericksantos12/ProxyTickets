# Sandbox Presence Status

## Status
Accepted

## Context
Mercado Pago sandbox mode changes payment behavior, but the running bot does not make that mode visible in Discord. Admins can miss that the bot is using sandbox credentials or test behavior.

`MP_SANDBOX` also defaulted to `true`, making sandbox behavior active when the variable was omitted. Production should be the default unless sandbox is explicitly enabled.

## Decision
Default `MP_SANDBOX` to `false`.

When `MP_SANDBOX=true`, set the bot activity to `Modo Sandbox` after the Discord client becomes ready.

Do not set or clear activity when sandbox is disabled, so future non-sandbox presence behavior remains unaffected.

## Alternatives Considered

### Keep sandbox as the default
- **Pros**: Safer for local testing.
- **Cons**: Production-like runs can silently use sandbox behavior if the env var is missing.
- **Why not**: The requested behavior is to make sandbox explicit.

### Always set a production/sandbox activity
- **Pros**: Both modes are visible.
- **Cons**: Adds product/status copy that was not requested and could overwrite future presence behavior.
- **Why not**: The requested visible marker only applies to sandbox mode.

## Consequences

### Positive
- Sandbox mode is visible in Discord.
- Production mode is the default when `MP_SANDBOX` is omitted.
- The change is isolated to env validation and startup presence.

### Negative
- Local/dev environments that relied on omitted `MP_SANDBOX` now need `MP_SANDBOX=true` for sandbox behavior.

### Risks
- If another startup event later sets activity after this event, it can overwrite `Modo Sandbox`.
