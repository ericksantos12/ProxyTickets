# Tasks: Discord Proxy Bot

**Input**: Design documents from `/specs/001-discord-proxy-bot/`  
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [data-model.md](data-model.md), [contracts/](contracts/)

**Constitution Compliance**: Per Constitution v2.0.0, Principle I (Unit Testing - Encouraged), unit tests are **optional but recommended** for quality assurance. This task list includes comprehensive test tasks that can be implemented if desired. Developers may choose to skip test tasks and proceed directly to implementation based on project needs.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story (Principle V).

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize Node.js project with package.json and TypeScript 5.0+ configuration
- [ ] T002 [P] Install core dependencies: discord.js 14.x, better-sqlite3, mercadopago SDK, express, winston, dotenv
- [ ] T003 [P] Install dev dependencies: Jest, ts-jest, @types/jest, @types/node, eslint, prettier, typescript
- [ ] T004 [P] Configure TypeScript with tsconfig.json (ES2022 target, strict mode, all strictness flags enabled)
- [ ] T005 [P] Configure ESLint with @typescript-eslint parser and recommended rules
- [ ] T006 [P] Configure Prettier for code formatting
- [ ] T007 [P] Configure Jest with ts-jest preset (optional - only if implementing tests) in jest.config.js
- [ ] T008 Create project structure: src/, tests/, database/, config/, logs/ directories
- [ ] T009 Create .env.example with all required environment variables (DISCORD_TOKEN, DISCORD_CLIENT_ID, MERCADOPAGO_ACCESS_TOKEN, WEBHOOK_URL, ADMIN_USER_ID, etc.)
- [ ] T010 [P] Add npm scripts to package.json: dev, build, start, test, test:coverage, lint, format
- [ ] T011 [P] Create .gitignore (node_modules/, dist/, .env, database/*.db, logs/)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Foundation

- [ ] T012 Create database schema SQL in src/database/schema.ts with all 6 tables (tickets, orders, payments, payment_webhooks, price_config, ticket_history) per contracts/database.md
- [ ] T013 Create database connection manager in src/database/connection.ts (singleton pattern, better-sqlite3, WAL mode enabled)
- [ ] T014 Create migration runner in src/database/migrations/001_initial_schema.ts to execute schema.ts
- [ ] T015 Create database seeder for price_config default values in src/database/migrations/002_seed_defaults.ts (sheet: R$5, ink: R$2, lamination: R$1.50, deckbox: R$15, sleeves: R$10)
- [ ] T016 Unit test for connection manager in tests/unit/database/connection.test.ts (test singleton, WAL mode, error handling)
- [ ] T017 Integration test for schema migration in tests/integration/database/migrations.test.ts (verify all tables, triggers, indexes created)

### Configuration & Logging

- [ ] T018 [P] Create environment configuration loader in src/config/env.ts (validate all required vars, throw on missing)
- [ ] T019 [P] Create application constants in src/config/constants.ts (status enums, timeouts, limits)
- [ ] T020 [P] Create Winston logger setup in src/utils/logger.ts (file + console transports, separate error.log and combined.log)
- [ ] T021 [P] Unit test for env loader in tests/unit/config/env.test.ts (test missing vars, invalid formats)

### Discord Bot Core

- [ ] T022 Create Discord client initialization in src/index.ts (intents: GUILDS, GUILD_MESSAGES, GUILD_MEMBERS, MESSAGE_CONTENT)
- [ ] T023 Create command registry in src/discord/commandRegistry.ts (load and register slash commands)
- [ ] T024 Create interaction handler router in src/discord/interactionHandler.ts (route to commands, buttons, selects, modals)
- [ ] T025 [P] Create embed builder utilities in src/discord/embeds.ts (standard message formats, colors, footers)
- [ ] T026 [P] Create permission checker utility in src/discord/permissions.ts (isAdmin, hasChannelAccess)
- [ ] T027 [P] Unit test for permission checker in tests/unit/discord/permissions.test.ts

### Express Webhook Server

- [ ] T028 Create Express server setup in src/webhook/server.ts (single POST endpoint /webhooks/mercadopago)
- [ ] T029 Create webhook signature validator in src/webhook/validator.ts (Mercado Pago signature verification)
- [ ] T030 Integration test for webhook endpoint in tests/integration/webhook/server.test.ts (test valid/invalid signatures)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Sistema Básico de Tickets (Priority: P1) 🎯 MVP

**Goal**: Enable customers to create ticket channels via button click. Enforce one-ticket-per-user rule.

**Independent Test**: Create ticket via button → verify channel created in correct category → confirm user has access → verify rejection when user has active ticket

### Tests for User Story 1 (Optional - Recommended for Quality) ✓

> **CONSTITUTION GUIDANCE**: Tests are optional per Constitution v2.0.0, Principle I (Unit Testing - Encouraged). However, they are strongly recommended for production systems. If implementing tests, follow test-first development (write tests before implementation) per Principle IV for better design. **These test tasks (T031-T036) can be skipped if desired.**

- [ ] T031 [P] [US1] Unit tests for Ticket model in tests/unit/models/Ticket.test.ts (test validation, status enum, constructor)
- [ ] T032 [P] [US1] Unit tests for TicketRepository in tests/unit/repositories/TicketRepository.test.ts (test CRUD, findActiveByUser, status updates)
- [ ] T033 [P] [US1] Unit tests for TicketService in tests/unit/services/TicketService.test.ts (test createTicket logic, one-ticket-per-user enforcement, channel creation logic)
- [ ] T034 [P] [US1] Contract test for /setup command in tests/contract/commands/setup.test.ts (test parameter validation, response format per contracts/commands.md)
- [ ] T035 [P] [US1] Contract test for create-ticket button interaction in tests/contract/interactions/createTicket.test.ts (test button response, ephemeral messages)
- [ ] T036 [US1] Integration test for ticket creation flow in tests/integration/ticket-creation-flow.test.ts (mock Discord API, test full flow from button click to channel creation)

### Implementation for User Story 1

- [ ] T037 [P] [US1] Create Ticket model in src/models/Ticket.ts with status enum (NEW, COLLECTING, PENDING_PAYMENT, APPROVED, READY, DELIVERED, EXPIRED, CANCELLED)
- [ ] T038 [P] [US1] Create TicketRepository in src/repositories/TicketRepository.ts (methods: create, findById, findByChannelId, findActiveByUser, updateStatus, archive)
- [ ] T039 [US1] Create TicketService in src/services/TicketService.ts (enforce one-ticket rule, create Discord channel with permissions, create ticket record, send welcome message)
- [ ] T040 [US1] Create /setup slash command in src/commands/admin/setup.ts (store config, post button in ticket channel, send admin panel welcome)
- [ ] T041 [US1] Create create-ticket button handler in src/discord/interactions/buttons/createTicket.ts (check active ticket, call TicketService, send rejection if active ticket exists)
- [ ] T042 [US1] Add category manager utility in src/discord/categoryManager.ts (moveChannelToCategory helper with error handling)
- [ ] T043 [US1] Add logging for all ticket operations (creation, rejection, errors) using Winston logger
- [ ] T044 [US1] Verify US1 implementation works correctly (manual testing or run automated tests if implemented)

**Checkpoint**: User Story 1 complete - users can create tickets, one-ticket rule enforced, channels organized

---

## Phase 4: User Story 2 - Formulário de Pedido (Priority: P2)

**Goal**: Collect order information via interactive form: extras (select menu), card count (message collector), decklist URL (message collector with validation)

**Independent Test**: In a ticket channel → click "Iniciar Pedido" → select extras → enter card count → enter decklist URL → verify all data stored

### Tests for User Story 2 (Optional - Recommended for Quality) ✓

> **CONSTITUTION GUIDANCE**: Tests are optional but recommended. **These test tasks (T045-T050) can be skipped if desired.**

- [ ] T045 [P] [US2] Unit tests for Order model in tests/unit/models/Order.test.ts (test validation, sheet_count calculation, URL regex)
- [ ] T046 [P] [US2] Unit tests for OrderRepository in tests/unit/repositories/OrderRepository.test.ts (test create, findByTicketId, update)
- [ ] T047 [P] [US2] Unit tests for OrderService in tests/unit/services/OrderService.test.ts (test form state management, validation logic, URL regex)
- [ ] T048 [P] [US2] Unit tests for validation utility in tests/unit/utils/validation.test.ts (test card count bounds 1-1000, URL regex patterns)
- [ ] T049 [P] [US2] Contract test for start-order button in tests/contract/interactions/startOrder.test.ts (test select menu format per contracts/commands.md)
- [ ] T050 [US2] Integration test for order form flow in tests/integration/order-form-flow.test.ts (test full form workflow with valid/invalid inputs)

### Implementation for User Story 2

- [ ] T051 [P] [US2] Create Order model in src/models/Order.ts with validation rules (card_count: 1-1000, decklist_url regex: ^https?://)
- [ ] T052 [P] [US2] Create OrderRepository in src/repositories/OrderRepository.ts (methods: create, findByTicketId, update, calculateSheetCount helper)
- [ ] T053 [P] [US2] Create validation utility in src/utils/validation.ts (validateCardCount, validateDecklistUrl functions)
- [ ] T054 [US2] Create OrderService in src/services/OrderService.ts (manage form state in memory Map, handle select menu, message collectors for card count and URL)
- [ ] T055 [US2] Create start-order button handler in src/discord/interactions/buttons/startOrder.ts (show extras select menu)
- [ ] T056 [US2] Create extras select menu handler in src/discord/interactions/selectMenus/selectExtras.ts (store selection, prompt for card count)
- [ ] T057 [US2] Add message collector for card count in OrderService with validation and retry on invalid input
- [ ] T058 [US2] Add message collector for decklist URL in OrderService with regex validation and error messages per spec ("URL inválida. Por favor forneça um link válido começando com http:// ou https://")
- [ ] T059 [US2] Update ticket status to COLLECTING when form starts, persist order to database when form completes
- [ ] T060 [US2] Verify US2 implementation works correctly (manual testing or run automated tests if implemented)

**Checkpoint**: User Story 2 complete - order forms collect all required information with validation

---

## Phase 5: User Story 3 - Cálculo de Preço e Pagamento (Priority: P3)

**Goal**: Calculate order price using formula (sheets = ceil(cards/9), total = materials + extras), generate Mercado Pago Pix payment with QR code, implement 24-hour timeout with 1-hour warning

**Independent Test**: Provide order data → verify price calculation → confirm Pix key and QR code generated → verify timeout warnings and expiration

### Tests for User Story 3 (Optional - Recommended for Quality) ✓

> **CONSTITUTION GUIDANCE**: Tests are optional but recommended, especially for payment logic. **These test tasks (T061-T070) can be skipped if desired.**

- [ ] T061 [P] [US3] Unit tests for Payment model in tests/unit/models/Payment.test.ts (test validation, status enum)
- [ ] T062 [P] [US3] Unit tests for PriceConfig model in tests/unit/models/PriceConfig.test.ts (test singleton, defaults)
- [ ] T063 [P] [US3] Unit tests for PaymentRepository in tests/unit/repositories/PaymentRepository.test.ts (test create, findByOrderId, updateStatus)
- [ ] T064 [P] [US3] Unit tests for ConfigRepository in tests/unit/repositories/ConfigRepository.test.ts (test getPriceConfig, updatePricing)
- [ ] T065 [P] [US3] Unit tests for price calculator in tests/unit/utils/calculator.test.ts (test sheet calculation, pricing formula with all combinations from quickstart.md table)
- [ ] T066 [P] [US3] Unit tests for PaymentService in tests/unit/services/PaymentService.test.ts (test Mercado Pago API calls with mocks, retry logic, error handling)
- [ ] T067 [P] [US3] Contract test for Mercado Pago API in tests/contract/mercadopago.test.ts (test request/response format, QR code generation)
- [ ] T068 [P] [US3] Contract test for /config-pricing command in tests/contract/commands/configPricing.test.ts
- [ ] T069 [US3] Integration test for payment generation flow in tests/integration/payment-flow.test.ts (test full flow with Mercado Pago mock)
- [ ] T070 [US3] Integration test for payment timeout scheduler in tests/integration/payment-timeout.test.ts (test 23h warning, 24h expiration)

### Implementation for User Story 3

- [ ] T071 [P] [US3] Create Payment model in src/models/Payment.ts with status enum (PENDING, APPROVED, CANCELLED, EXPIRED)
- [ ] T072 [P] [US3] Create PriceConfig model in src/models/PriceConfig.ts with default values
- [ ] T073 [P] [US3] Create PaymentRepository in src/repositories/PaymentRepository.ts (methods: create, findByOrderId, updateStatus, findPendingExpiring)
- [ ] T074 [P] [US3] Create ConfigRepository in src/repositories/ConfigRepository.ts (methods: getPriceConfig, updatePricing, getSingleton)
- [ ] T075 [P] [US3] Create price calculator utility in src/utils/calculator.ts (calculateSheetCount, calculateTotalPrice functions per data-model.md formula)
- [ ] T076 [US3] Create PaymentService in src/services/PaymentService.ts with Mercado Pago SDK integration (generatePixPayment method with retry logic: 3 attempts, 1s/2s/4s exponential backoff)
- [ ] T077 [US3] Add retry wrapper utility in src/utils/retry.ts (exponentialBackoff function for Mercado Pago API calls)
- [ ] T078 [US3] Create /config-pricing command in src/commands/admin/configPricing.ts (update price_config, show example calculation)
- [ ] T079 [US3] Add payment generation to OrderService.completeForm() (calculate price, call PaymentService, show Pix key + QR code, move to PENDING_PAYMENT status)
- [ ] T080 [US3] Create payment timeout scheduler in src/services/TimeoutScheduler.ts (check every 10 minutes, send 1-hour warnings, expire 24-hour old payments)
- [ ] T081 [US3] Add error handling for Mercado Pago failures (show user-friendly message, notify admin via DM per NFR-004)
- [ ] T082 [US3] Move channel to PENDENTES category when payment generated, set expires_at timestamp
- [ ] T083 [US3] Verify US3 implementation works correctly (manual testing or run automated tests if implemented)

**Checkpoint**: User Story 3 complete - payments generated with QR codes, timeouts enforced

---

## Phase 6: User Story 4 - Processamento de Pagamento (Priority: P4)

**Goal**: Monitor payment status via Mercado Pago webhooks, update ticket status on approval, handle refunds/cancellations, notify admin

**Independent Test**: Simulate webhook → verify status update → confirm channel moved → verify admin notification → test refund webhook

### Tests for User Story 4 (Optional - Recommended for Quality) ✓

> **CONSTITUTION GUIDANCE**: Tests are optional but recommended for webhook handling. **These test tasks (T084-T089) can be skipped if desired.**

- [ ] T084 [P] [US4] Unit tests for PaymentWebhook model in tests/unit/models/PaymentWebhook.test.ts (test validation, audit fields)
- [ ] T085 [P] [US4] Unit tests for PaymentWebhookRepository in tests/unit/repositories/PaymentWebhookRepository.test.ts (test create, audit trail)
- [ ] T086 [P] [US4] Unit tests for webhook handler in tests/unit/webhook/webhookHandler.test.ts (test signature validation, payment lookup, status transitions)
- [ ] T087 [P] [US4] Contract test for webhook endpoint in tests/contract/webhook/mercadopago.test.ts (test webhook payload format per Mercado Pago docs)
- [ ] T088 [US4] Integration test for payment approval flow in tests/integration/payment-approval-flow.test.ts (webhook → status update → channel move → admin notification)
- [ ] T089 [US4] Integration test for payment refund flow in tests/integration/payment-refund-flow.test.ts (refund webhook → cancellation → archive)

### Implementation for User Story 4

- [ ] T090 [P] [US4] Create PaymentWebhook model in src/models/PaymentWebhook.ts for audit trail
- [ ] T091 [P] [US4] Create PaymentWebhookRepository in src/repositories/PaymentWebhookRepository.ts (methods: create, findByWebhookId)
- [ ] T092 [US4] Create webhook handler in src/webhook/webhookHandler.ts (validate signature, log webhook, route to PaymentService)
- [ ] T093 [US4] Add payment approval handler to PaymentService (update payment status, update ticket status to APPROVED, move channel to APROVADO category)
- [ ] T094 [US4] Add payment refund/cancellation handler to PaymentService (update to CANCELLED, archive channel, notify customer and admin per FR-019D)
- [ ] T095 [US4] Create admin notification service in src/services/NotificationService.ts (sendAdminDM method with order details embed per contracts/commands.md)
- [ ] T096 [US4] Add payment status message updater (edit original payment message: "🔄 Processando..." → "✅ APROVADO" with timestamp)
- [ ] T097 [US4] Add webhook audit logging (save all webhooks to payment_webhooks table for debugging)
- [ ] T098 [US4] Integrate webhook endpoint with Express server in src/webhook/server.ts (route POST /webhooks/mercadopago to webhookHandler)
- [ ] T099 [US4] Verify US4 implementation works correctly (manual testing or run automated tests if implemented)

**Checkpoint**: User Story 4 complete - payments automatically processed, admin notified

---

## Phase 7: User Story 5 - Painel Administrativo (Priority: P5)

**Goal**: Admin can list orders by status, mark as ready for delivery, mark as delivered for archival

**Independent Test**: Run /list-orders → verify filtering → click "Marcar Pronto" → verify status change → click "Marcar Entregue" → verify archival

### Tests for User Story 5 (Optional - Recommended for Quality) ✓

> **CONSTITUTION GUIDANCE**: Tests are optional but recommended for admin operations. **These test tasks (T100-T105) can be skipped if desired.**

- [ ] T100 [P] [US5] Unit tests for TicketHistory model in tests/unit/models/TicketHistory.test.ts (test audit trail)
- [ ] T101 [P] [US5] Unit tests for TicketHistoryRepository in tests/unit/repositories/TicketHistoryRepository.test.ts (test create, findByTicketId)
- [ ] T102 [P] [US5] Unit tests for AdminService in tests/unit/services/AdminService.test.ts (test listOrders filtering, status transitions, permission checks)
- [ ] T103 [P] [US5] Contract test for /list-orders command in tests/contract/commands/listOrders.test.ts (test embed format, button layout per contracts/commands.md)
- [ ] T104 [P] [US5] Contract test for admin buttons in tests/contract/interactions/adminButtons.test.ts (mark-ready, mark-delivered buttons)
- [ ] T105 [US5] Integration test for admin workflow in tests/integration/admin-flow.test.ts (test full lifecycle: list → mark ready → mark delivered)

### Implementation for User Story 5

- [ ] T106 [P] [US5] Create TicketHistory model in src/models/TicketHistory.ts for audit trail
- [ ] T107 [P] [US5] Create TicketHistoryRepository in src/repositories/TicketHistoryRepository.ts (methods: create, findByTicketId)
- [ ] T108 [US5] Create AdminService in src/services/AdminService.ts (methods: listOrders with filtering, markReady, markDelivered)
- [ ] T109 [US5] Create /list-orders command in src/commands/admin/listOrders.ts (query orders by status, build embed with buttons per contracts/commands.md)
- [ ] T110 [US5] Create mark-ready button handler in src/discord/interactions/buttons/markReady.ts (call AdminService.markReady, update ticket to READY status, notify customer)
- [ ] T111 [US5] Create mark-delivered button handler in src/discord/interactions/buttons/markDelivered.ts (call AdminService.markDelivered, update to DELIVERED, archive channel after 1 hour)
- [ ] T112 [US5] Add permission checks to all admin commands and buttons (only ADMIN_USER_ID can execute)
- [ ] T113 [US5] Add ticket history tracking for all status transitions (log to ticket_history table with old_status, new_status, changed_by, timestamp)
- [ ] T114 [US5] Create channel archival utility in src/discord/archiveChannel.ts (lock channel, add final message, archive after delay)
- [ ] T115 [US5] Verify US5 implementation works correctly (manual testing or run automated tests if implemented)

**Checkpoint**: User Story 5 complete - full admin panel operational

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final touches, logging, error handling, documentation

- [ ] T116 [P] Add comprehensive error handling for all Discord API calls (rate limits, permission errors, network failures)
- [ ] T117 [P] Add structured logging for all important operations (ticket lifecycle, payments, admin actions) using Winston
- [ ] T118 [P] Create deployment guide in docs/deployment.md (bot token setup, webhook configuration, database initialization)
- [ ] T119 [P] Create Mercado Pago integration guide in docs/mercadopago-setup.md (API credentials, webhook registration, testing)
- [ ] T120 [P] Add README.md with project overview, setup instructions, and architecture diagram
- [ ] T121 Run full test suite if tests were implemented
- [ ] T122 Run ESLint and fix all warnings
- [ ] T123 Run Prettier to format all code
- [ ] T124 Create Docker configuration (Dockerfile, docker-compose.yml) for easy deployment
- [ ] T125 Add health check endpoint to Express server (GET /health returns bot status)
- [ ] T126 Create systemd service file for Linux deployment in deployment/proxytickets.service
- [ ] T127 Manual E2E testing using quickstart.md scenarios (all 5 user stories)
- [ ] T128 Performance testing: verify <500ms command response, <1s ticket creation, <2min payment processing

---

## Dependencies Graph (User Story Completion Order)

```
Phase 1 (Setup) → Phase 2 (Foundation) → ↓
                                          
Phase 3 (US1: Tickets) → Phase 4 (US2: Forms) → Phase 5 (US3: Payment) → Phase 6 (US4: Processing)
                                                                                  ↓
                                                                         Phase 7 (US5: Admin)
                                                                                  ↓
                                                                         Phase 8 (Polish)
```

**Critical Path**: Setup → Foundation → US1 → US2 → US3 → US4 → US5 → Polish

**Parallel Opportunities**:
- **After Foundation**: All foundation tasks (T012-T030) can be parallelized
- **Within US1**: T031-T035 (all tests), T037-T038 (models), T042-T043 (utilities)
- **Within US2**: T045-T049 (all tests), T051-T053 (models/utils)
- **Within US3**: T061-T070 (all tests), T071-T075 (models/repos), T077 (retry utility)
- **Within US4**: T084-T087 (all tests), T090-T091 (models)
- **Within US5**: T100-T105 (all tests), T106-T107 (models)
- **Phase 8**: T116-T120 (all documentation/polish tasks)

---

## Parallel Execution Examples

### Phase 2 Foundation (All can run in parallel after setup)
```bash
# Terminal 1: Database
npm test -- tests/unit/database/ && npm run dev:migrate

# Terminal 2: Configuration
npm test -- tests/unit/config/ && npm run lint src/config/

# Terminal 3: Discord Core  
npm test -- tests/unit/discord/ && npm run lint src/discord/

# Terminal 4: Webhook Server
npm test -- tests/integration/webhook/ && npm run dev:webhook
```

### User Story 1 (Tests + Models in parallel)
```bash
# Terminal 1: Write and run model tests
npm test -- tests/unit/models/Ticket.test.ts --watch

# Terminal 2: Write and run repository tests
npm test -- tests/unit/repositories/TicketRepository.test.ts --watch

# Terminal 3: Write and run service tests
npm test -- tests/unit/services/TicketService.test.ts --watch

# Terminal 4: Write contract tests
npm test -- tests/contract/commands/setup.test.ts --watch
```

---

## Implementation Strategy

### MVP Scope (Recommended First Delivery)

**User Story 1 Only**: Basic ticket system
- Demonstrates core infrastructure working
- Provides immediate value (customers can create tickets)
- Tests foundational components (database, Discord bot, commands)
- Estimated: 2-3 days

### Incremental Delivery Plan

1. **Week 1**: Setup + Foundation + US1 (MVP)
2. **Week 2**: US2 (Forms) + US3 (Payment)
3. **Week 3**: US4 (Processing) + US5 (Admin)
4. **Week 4**: Polish + Testing + Deployment

### Constitution Compliance Validation

- ✓ **Principle I (Unit Testing - Encouraged)**: 45 optional test tasks (T016, T021, T031-T035, T045-T050, T061-T070, T084-T089, T100-T105) - can be skipped per Constitution v2.0.0
- ✓ **Principle II (Simplicity First)**: Direct library usage (discord.js, better-sqlite3), no over-engineering
- ✓ **Principle III (Best Practices)**: TypeScript strict mode (T004), ESLint (T005), logging (T020), error handling (T116)
- ✓ **Principle IV (Test-First)**: Test-first workflow available for developers who choose to implement tests
- ✓ **Principle V (User Story Independence)**: Each phase 3-7 can be deployed independently per quickstart.md

---

## Task Summary

- **Total Tasks**: 128
- **Setup Tasks**: 11 (T001-T011)
- **Foundation Tasks**: 19 (T012-T030)
- **User Story 1 Tasks**: 14 (T031-T044)
- **User Story 2 Tasks**: 16 (T045-T060)
- **User Story 3 Tasks**: 23 (T061-T083)
- **User Story 4 Tasks**: 16 (T084-T099)
- **User Story 5 Tasks**: 16 (T100-T115)
- **Polish Tasks**: 13 (T116-T128)

**Parallelizable Tasks**: 58 tasks marked with [P] (45% of total)

**Test Coverage**: 45 optional test tasks available for developers who choose to implement tests

**Independent Deliverables**: 5 user stories, each fully functional and testable on its own

---

**Generated**: 2026-02-24  
**Command**: `/speckit.tasks`  
**Next Step**: Begin implementation starting with Phase 1 (Setup)
