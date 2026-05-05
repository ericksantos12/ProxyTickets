# AGENTS.md

## Project Context
- This is a Discord tickets bot for selling Magic: The Gathering proxies, built on RinckoDev's Constatic bot base (`@constatic/base`). Do not replace the Constatic loader/creator pattern with a custom framework.
- Target flow: a config command stores pricing inputs (paper packs, holographic/adhesive materials, labor, sleeves, etc.); a ticket command posts an embed with a button; the button opens a temporary text channel; the bot collects order choices, calculates price, generates a PIX QR code, detects payment, notifies the user, and opens/updates private admin order handling until the ticket channel is closed.
- The project is not intended to follow TDD or contain unit tests. Prefer `npm run check`, `npm run build`, and focused manual Discord verification.

## ADRs And Feature Tasks
- For every new feature plan, create the ADR in `docs/adr/NNNN-feature-name.md` and the matching task file in `docs/adr/tasks/NNNN-feature-name.md` first, before asking whether to implement code.
- After the ADR and task file exist, ask the user whether they want to proceed with implementation before making code, schema, or database changes.
- For complex new functionality, use the `grill-me` skill before writing the ADR/task files to gather detailed requirements one question at a time. A small addition to an existing screen or existing feature does not require `grill-me` unless the user asks for it.
- For every new feature, create an ADR in `docs/adr/NNNN-feature-name.md` before implementation.
- For every feature ADR, create a matching task file in `docs/adr/tasks/NNNN-feature-name.md` before implementation.
- The agent must consult the matching task file before and during feature implementation.
- Keep ADRs focused on context, decisions, trade-offs, and consequences; keep execution details in the task file.
- Task files must use markdown checklists and include implementation and validation steps.
- Update task checkboxes as work progresses so the task file remains the source of truth for the current feature.

## Commands
- Use npm; `package-lock.json` is the lockfile. Node.js must be `20.12` or newer.
- `npm run dev` runs `tsx --env-file=.env ./src/index.ts`; `npm run dev:dev` uses `.env.dev`.
- `npm run watch` and `npm run watch:dev` are the watch-mode equivalents.
- `npm run check` is the only type verification command: `tsc --noEmit`.
- `npm run build` runs `tsup`; `npm start` runs compiled `build/index.js` and first runs `prisma migrate deploy` through `prestart`.
- There is no lint or test script in this repo.

## Constatic Wiring
- `src/index.ts` only calls `bootstrap({ meta: import.meta, env })`; Constatic then loads `./discord/**/*.{js,ts,jsx,tsx}` and excludes `discord/index`.
- Commands, events, and responders register by calling creators at module top level. Import them from `#base`, which is defined in `src/discord/index.ts` via `setupCreators()`.
- Prefer helpers, functions, and wrappers from `@constatic/base` over direct Discord.js primitives when Constatic provides an equivalent.
- Before importing Discord.js builders, classes, guards, or interaction helpers directly, check `node_modules/@constatic/base` and existing `#base` exports for the Constatic-native API.
- Use direct `discord.js` APIs only when `@constatic/base` does not provide a suitable function/wrapper, or when interoperability with a Discord.js type is explicitly required.
- Put slash commands under `src/discord/commands`, interaction responders under `src/discord/responders`, and Discord events under `src/discord/events` so the bootstrap glob finds them.
- This repo is ESM (`"type": "module"`). Use `.js` extensions in relative TypeScript imports that must work after build, as existing files do.

## Prisma And Env
- Prisma uses MongoDB. The schema root is the `prisma/` directory, with models split under `prisma/models/*.prisma`.
- Prisma Client is generated into `src/database/prisma`; treat that directory as generated code. Use the exported singleton from `src/database/index.ts` (`prisma`) instead of importing generated internals directly.
- `prisma.config.ts` loads `.env` by default; append `-- --dev` to Prisma CLI commands when they accept passthrough args, or set `PRISMA_ENV=dev` for commands like `prisma db push` that reject extra args.
- Required env vars are `BOT_TOKEN` and `DATABASE_URL`; optional env vars currently validated are `WEBHOOK_LOGS_URL` and `GUILD_ID`.

## Imports And Aliases
- TypeScript aliases in `tsconfig.json` point at `src/*`; runtime package imports in `package.json` point at `build/*`. If adding or changing an alias, update both places.
- Existing aliases include `#env`, `#base`, `#functions`, `#database`, `#server`, `#menus`, `#tools`, `#lib/*`, `#shared/*`, and `#types/*`; only some directories exist today.
