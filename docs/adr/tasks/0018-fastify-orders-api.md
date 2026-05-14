# Fastify Orders API Tasks

## Implementation

- [x] Add Fastify dependency.
- [x] Add `API_TOKEN`, `API_HOST`, and `API_PORT` env validation.
- [x] Create `src/server/index.ts` to build and start the Fastify server.
- [x] Add Bearer Token authentication hook for protected order endpoints.
- [x] Add read-only order query helpers using the existing Prisma singleton.
- [x] Add `GET /health` endpoint.
- [x] Add `GET /orders/in-progress` endpoint.
- [x] Add `GET /orders/cancelled` endpoint.
- [x] Add `GET /orders/concluded` endpoint.
- [x] Add `GET /orders` endpoint with optional status filtering.
- [x] Start the API from `src/index.ts` without replacing Constatic bootstrap.
- [x] Document API env vars and example requests in README or `.env.example` if those files exist.

## Validation

- [x] Run `npm install` to update `package-lock.json`.
- [x] Run `npm run check`.
- [x] Run `npm run build`.
- [ ] Manually verify unauthenticated order endpoints return `401`.
- [ ] Manually verify invalid Bearer Token returns `401`.
- [ ] Manually verify valid Bearer Token can read in-progress orders.
- [ ] Manually verify valid Bearer Token can read cancelled orders.
- [ ] Manually verify valid Bearer Token can read concluded orders.
- [x] Commit the implemented ADR using a Conventional Commits message.
- [x] Push branch and open a pull request with generated title and description.
