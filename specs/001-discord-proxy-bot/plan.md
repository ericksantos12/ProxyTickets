# Implementation Plan: Discord Proxy Bot

**Branch**: `001-discord-proxy-bot` | **Date**: 2026-02-24 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-discord-proxy-bot/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Bot de Discord para gerenciar pedidos de cartas proxy de Magic the Gathering. Sistema completo de tickets automatizado que permite clientes submeterem pedidos através de formulários interativos, calcula preços automaticamente baseado em materiais configuráveis, processa pagamentos via Pix/Mercado Pago, e fornece painel administrativo para gestão do ciclo de vida completo dos pedidos (aprovação → produção → entrega → arquivamento). Construído em TypeScript com SQLite para persistência de dados.

## Technical Context

**Language/Version**: TypeScript 5.0+ (ES2022 target, strict mode enabled)  
**Primary Dependencies**: discord.js 14.x, better-sqlite3, mercadopago SDK, express (webhook server), winston (logging)  
**Storage**: SQLite 3 via better-sqlite3 (synchronous, file-based at `./database/proxytickets.db`)  
**Testing**: Jest + ts-jest, @types/jest, 80% coverage threshold enforced  
**Target Platform**: Node.js 18+ LTS (Linux/Windows server, single instance deployment)  
**Project Type**: Discord bot application (long-running service with webhook HTTP endpoint)  
**Performance Goals**: <500ms command response, <1s ticket creation, real-time payment webhook processing (<2min)  
**Constraints**: Single server, SQLite write constraints (no concurrent writes), webhook URL must be publicly accessible  
**Scale/Scope**: Small business (1-50 concurrent orders, single Discord server, 100+ tickets/month, single admin initially)

**Note**: Original plan referenced "Constatic" framework which does not exist. Research (see [research.md](research.md)) determined pure discord.js is most appropriate per Simplicity First principle.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Based on `.specify/memory/constitution.md`:

### Initial Evaluation (Pre-Research)

- [x] **Unit Testing**: Feature includes comprehensive unit tests with ≥80% coverage
  - Jest configured for unit + integration tests
  - All commands, services, and database operations will be tested
  - Discord.js interactions mockable for isolated testing
  
- [x] **Simplicity First**: Solution uses simplest approach; any complexity is justified in Complexity Tracking
  - SQLite: Simple, embedded database (no server required)
  - discord.js: Pure library (avoids framework overhead - see research.md)
  - Linear workflow: ticket creation → form → payment → status updates
  
- [x] **Best Practices**: Code follows language conventions, SOLID principles, and industry standards
  - TypeScript strict mode for type safety
  - ESLint + Prettier for consistent code style
  - Separation of concerns: commands/services/repositories
  - Environment variables for configuration
  
- [x] **Test-First Development**: Tests designed before implementation, acceptance criteria clear
  - Spec has clear Given/When/Then scenarios for all 5 user stories
  - Each acceptance scenario maps to specific test cases
  - Tests will be written per user story before implementation
  
- [x] **User Story Independence**: User stories are independently testable and deliverable
  - US1 (Tickets): Standalone ticket creation system
  - US2 (Form): Independent data collection (requires US1)
  - US3 (Payment): Self-contained pricing + payment (requires US2)
  - US4 (Status): Independent payment monitoring (requires US3)
  - US5 (Admin): Standalone admin panel (requires database from US4)

**Initial Status**: ✅ PASS

### Post-Design Re-Evaluation (After Phase 1)

**Completed Artifacts**: research.md, data-model.md, contracts/commands.md, contracts/database.md, quickstart.md

- [x] **Principle I - Unit Testing (NON-NEGOTIABLE)**:
  - ✅ quickstart.md includes test scenarios for each user story
  - ✅ Test validation sections reference unit test files for all services
  - ✅ Integration test coverage planned for all workflows
  - ✅ Database schema includes triggers/views that support testability
  - ✅ Command interfaces designed for mockability (dependency injection)
  - **Evidence**: quickstart.md sections "Test Validation" for all 5 user stories

- [x] **Principle II - Simplicity First**:
  - ✅ Research resolved Constatic → discord.js (simpler, no framework abstraction)
  - ✅ Data model: 6 tables only (no over-normalization)
  - ✅ Database triggers handle auto-timestamps (no manual code)
  - ✅ better-sqlite3: synchronous API (simpler than async alternatives)
  - ✅ No microservices, no message queues, no external caching
  - **Evidence**: research.md "Decision 1: Core Discord Framework" rationale

- [x] **Principle III - Best Practices**:
  - ✅ TypeScript strict mode enforced in all contracts
  - ✅ Database schema follows 3NF normalization
  - ✅ Proper indexing on foreign keys and frequently queried columns
  - ✅ RESTful webhook endpoint design
  - ✅ Graceful error handling patterns in command contracts
  - ✅ Transaction patterns documented for data integrity
  - **Evidence**: contracts/database.md schema design, contracts/commands.md error handling

- [x] **Principle IV - Test-First Development**:
  - ✅ Acceptance criteria in spec.md mapped to test scenarios in quickstart.md
  - ✅ Each user story has dedicated test section with expected results
  - ✅ Test data and fixtures planned (see quickstart.md "Test Steps")
  - ✅ Performance benchmarks defined upfront (<1s ticket, <500ms commands)
  - ✅ E2E testing scenario documented for complete workflow
  - **Evidence**: quickstart.md provides test-first guidance for all features

- [x] **Principle V - User Story Independence**:
  - ✅ quickstart.md confirms each user story testable independently
  - ✅ Database schema supports partial feature deployment
  - ✅ US1 can be deployed without US2-5 (basic ticket system)
  - ✅ US2 depends on US1, but US3-5 can be skipped initially
  - ✅ Admin panel (US5) independent from payment processing (US4)
  - **Evidence**: quickstart.md separate test sections for each US

**Final Status**: ✅ PASS - All 5 constitution principles validated after detailed design. Architecture decisions align with:
- Unit testing enforced through test scenarios and mockable interfaces
- Simplicity achieved through direct library usage and minimal dependencies
- Best practices applied in schema design, TypeScript config, and error handling
- Test-first workflow enabled through quickstart.md guidance
- User story independence preserved in database schema and contract design

**No violations identified. No complexity justification required.**

## Project Structure

### Documentation (this feature)

```text
specs/001-discord-proxy-bot/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── commands.md      # Command interface contracts
│   └── database.md      # Database schema contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
ProxyTickets/
├── src/
│   ├── commands/              # Discord command handlers
│   │   ├── ticket/            # Ticket management commands
│   │   ├── admin/             # Admin-only commands
│   │   └── config/            # Configuration commands
│   ├── services/              # Business logic layer
│   │   ├── TicketService.ts   # Ticket creation & management
│   │   ├── OrderService.ts    # Order processing & pricing
│   │   ├── PaymentService.ts  # Mercado Pago integration
│   │   └── AdminService.ts    # Admin operations
│   ├── repositories/          # Data access layer
│   │   ├── TicketRepository.ts
│   │   ├── OrderRepository.ts
│   │   ├── PaymentRepository.ts
│   │   └── ConfigRepository.ts
│   ├── models/                # Domain entities & types
│   │   ├── Ticket.ts
│   │   ├── Order.ts
│   │   ├── Payment.ts
│   │   └── PriceConfig.ts
│   ├── database/              # Database setup & migrations
│   │   ├── connection.ts      # SQLite connection management
│   │   ├── schema.ts          # Table definitions
│   │   └── migrations/        # Migration scripts
│   ├── discord/               # Discord-specific utilities
│   │   ├── interactions.ts    # Button/select menu handlers
│   │   ├── embeds.ts          # Message embed builders
│   │   └── permissions.ts     # Permission checks
│   ├── utils/                 # Shared utilities
│   │   ├── validation.ts      # Input validation
│   │   ├── calculator.ts      # Price calculation logic
│   │   └── logger.ts          # Logging utility
│   ├── config/                # Configuration management
│   │   ├── env.ts             # Environment variables
│   │   └── constants.ts       # Application constants
│   └── index.ts               # Bot entry point
│
├── tests/
│   ├── unit/                  # Unit tests (isolated components)
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── utils/
│   │   └── models/
│   ├── integration/           # Integration tests (multi-component)
│   │   ├── ticket-flow.test.ts
│   │   ├── payment-flow.test.ts
│   │   └── admin-flow.test.ts
│   ├── contract/              # Contract tests (external interfaces)
│   │   ├── discord-commands.test.ts
│   │   └── mercadopago.test.ts
│   ├── fixtures/              # Test data & mocks
│   │   ├── orders.ts
│   │   ├── tickets.ts
│   │   └── discord-mocks.ts
│   └── setup.ts               # Test environment setup
│
├── database/                  # SQLite database file (gitignored)
│   └── proxytickets.db
│
├── config/                    # Runtime configuration
│   └── .env.example           # Example environment variables
│
├── docs/                      # Additional documentation
│   ├── deployment.md          # Deployment guide
│   └── mercadopago-setup.md   # Payment integration guide
│
├── package.json               # Node.js dependencies & scripts
├── tsconfig.json              # TypeScript configuration
├── jest.config.js             # Jest test configuration
├── .eslintrc.js               # ESLint configuration
├── .prettierrc                # Prettier configuration
└── README.md                  # Project overview
```

**Structure Decision**: Single TypeScript project structure chosen as this is a standalone Discord bot application. All code resides in `src/` with clear separation of concerns: commands handle Discord interactions, services contain business logic, repositories manage data access, and models define domain entities. Tests mirror the source structure with unit/integration/contract separation per constitution requirements.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
