# Implementation Plan: Discord Proxy Bot

**Branch**: `001-discord-proxy-bot` | **Date**: 2026-02-24 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-discord-proxy-bot/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Discord bot for managing proxy Magic card orders through a ticket system. Primary features include automated ticket creation, guided order form collection, price calculation (9 cards per sheet formula), Pix payment via Mercado Pago integration, payment status monitoring, and admin management panel. Technical approach uses Discord.js for bot framework, Prisma ORM with SQLite for data persistence, and Mercado Pago SDK for payment processing. Implements retry logic with exponential backoff for API resilience and automated timeout handling for pending payments.

## Technical Context

**Language/Version**: TypeScript 5.x + Node.js 20.x LTS  
**Primary Dependencies**: discord.js 14.x, Prisma 5.x (SQLite), Mercado Pago SDK, dotenv, @constatic/base  
**Storage**: SQLite via Prisma ORM (embedded database, no separate server)  
**Testing**: Jest + ts-jest (optional per Constitution v2.0.0, recommended if tests implemented)  
**Target Platform**: Node.js server (Linux/Windows compatible)  
**Project Type**: Discord bot application (event-driven service, using Constatic framework)  
**Performance Goals**: <2min payment confirmation, <30s admin notifications, real-time Discord message handling  
**Constraints**: 24h payment timeout, exponential backoff retry (3 attempts: 1s/2s/4s), one ticket per user enforcement  
**Scale/Scope**: Small-to-medium business operation (~10-100 concurrent tickets, moderate transaction volume)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Based on `.specify/memory/constitution.md`:

- [x] **Unit Testing**: Feature will include unit tests for critical business logic (price calculation, validation, retry logic)
- [x] **Simplicity First**: Solution uses Discord.js native features, embedded SQLite (no separate DB server), standard Mercado Pago SDK
- [x] **Best Practices**: TypeScript strict mode, ESLint configuration, error handling, logging, environment variable management
- [x] **Test-First Development**: Acceptance criteria in spec.md guide test design; tests written during implementation
- [x] **User Story Independence**: All 5 user stories (US1-US5) are independently testable and deliverable with clear acceptance scenarios

**Status**: PASS (Initial + Post-Design Re-evaluation ✓)

**Notes**:
- No violations requiring justification
- Simplicity approach: Single Node.js process, embedded database, no microservices
- Dependencies justified: discord.js (required for Discord API), Prisma (typed ORM simplifies queries), Mercado Pago SDK (official payment integration), Constatic framework (convention over configuration, reduces boilerplate)

**Post-Design Re-evaluation (Phase 1 Complete)**:
- ✅ Data model maintains simplicity: 5 core entities with clear relationships
- ✅ No complex patterns introduced: Direct Prisma queries, no repository abstraction
- ✅ Architecture supports independent user story implementation via modular services
- ✅ Contracts defined for Discord commands and database schema
- ✅ Test framework selected (Jest) - implementation remains optional per Constitution v2.0.0
- **Confirmed**: All Constitution principles preserved through design phase

## Project Structure

### Documentation (this feature)

```text
specs/001-discord-proxy-bot/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── commands.md      # Discord command schemas
│   └── database.md      # Prisma schema contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Single project structure (Discord bot application)
src/
├── discord/
│   ├── commands/        # Slash commands and button interactions
│   ├── events/          # Discord event handlers
│   └── responders/      # Button/select menu responders
├── database/
│   ├── prisma/          # Generated Prisma client
│   └── index.ts         # Database connection and helpers
├── services/
│   ├── ticket.ts        # Ticket creation and management
│   ├── payment.ts       # Mercado Pago integration
│   ├── pricing.ts       # Price calculation logic
│   └── timeout.ts       # Payment timeout monitoring
├── utils/
│   ├── retry.ts         # Exponential backoff retry logic
│   └── validators.ts    # Input validation helpers
├── constants.ts         # Application constants
├── env.ts              # Environment variable validation
└── index.ts            # Bot entry point

prisma/
├── schema.prisma       # Main Prisma schema
└── models/             # Prisma model definitions
    ├── guild.prisma
    ├── member.prisma
    ├── ticket.prisma    # To be created
    ├── order.prisma     # To be created
    └── payment.prisma   # To be created

tests/
├── unit/
│   ├── pricing.test.ts
│   ├── validators.test.ts
│   └── retry.test.ts
├── integration/
│   ├── ticket.test.ts
│   └── payment.test.ts
└── contract/
    └── database.test.ts
```

**Structure Decision**: Single project structure is appropriate for this Discord bot application. No need for separate frontend/backend as all interaction happens through Discord. Prisma models are organized in separate files under `prisma/models/` for maintainability. Services layer separates business logic from Discord event handlers following separation of concerns.

## Complexity Tracking

> **No violations - Constitution Check passed**

No complexity requiring justification. Solution follows Simplicity First principle using standard libraries and embedded database.
