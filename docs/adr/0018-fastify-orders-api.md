# Fastify Orders API

## Status
Accepted

## Context
Admins need a programmatic way to inspect ticket orders currently stored and managed by the Discord bot. The key operational views are orders in progress, cancelled orders, and concluded orders.

The project already has a `#server` alias but no HTTP server implementation. The bot must keep using the Constatic bootstrap and Discord module loading pattern; the API should be added alongside the bot runtime instead of replacing the existing entrypoint architecture.

Because ticket orders contain customer, channel, pricing, payment, and operational data, the API must not be publicly readable. A simple shared-secret Bearer Token is enough for the current internal/admin use case and keeps the feature small.

## Decision
Add a Fastify HTTP API started from `src/index.ts` before or alongside the Constatic bootstrap.

The API will expose read-only order endpoints protected by `Authorization: Bearer <API_TOKEN>`:

- `GET /health` for basic process/API health without exposing order data.
- `GET /orders/in-progress` for active orders that are not terminal.
- `GET /orders/cancelled` for cancelled orders.
- `GET /orders/concluded` for concluded orders.
- `GET /orders` with optional `status` query for flexible status filtering.

The API will use the existing Prisma singleton from `#database` and return normalized JSON objects derived from `TicketOrder`. It will not mutate orders, payment data, Discord channels, or bot configuration.

Add environment validation for:

- `API_TOKEN`: required shared secret for order endpoints.
- `API_HOST`: optional, defaulting to `0.0.0.0`.
- `API_PORT`: optional, defaulting to `3000`.

The server should fail fast when configuration is invalid, matching the existing env validation style.

## Alternatives Considered

### Discord-only admin commands
- **Pros**: Avoids opening an HTTP surface.
- **Cons**: Does not support external dashboards, scripts, or integrations.
- **Why not**: The requested capability is an API.

### No authentication for local-only usage
- **Pros**: Simpler to call during development.
- **Cons**: Dangerous if deployed on a public host or exposed through Docker/reverse proxy.
- **Why not**: Order data is sensitive enough to require authentication by default.

### Session/JWT/OAuth authentication
- **Pros**: Better for multi-user dashboards and per-user authorization.
- **Cons**: More implementation and operational complexity than needed now.
- **Why not**: A single admin/internal API token is proportional for the current scope.

## Consequences

### Positive
- Admins and external tools can inspect orders without using Discord UI.
- The API is read-only, limiting the blast radius of the new surface.
- Bearer Token auth keeps deployment simple while avoiding public data exposure.

### Negative
- Adds a long-running HTTP listener to the bot process.
- Requires managing and rotating an additional secret.
- Adds Fastify as a runtime dependency.

### Risks
- If `API_TOKEN` leaks, order data can be read by unauthorized callers until the token is rotated.
- If the API port is exposed publicly without network controls, brute-force attempts may appear in logs.
- Running the bot and API in the same process means a fatal API startup error prevents the bot from starting, which is acceptable for fail-fast configuration but should be monitored in production.
