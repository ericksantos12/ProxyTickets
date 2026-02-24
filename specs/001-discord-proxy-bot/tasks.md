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

- [ ] T001 Verify Constatic project initialization (already exists per research.md - @constatic/base installed)
- [ ] T002 [P] Install additional dependencies: mercadopago SDK, @prisma/client, node-cron
- [ ] T003 [P] Install dev dependencies: Jest, ts-jest, @types/jest, @types/node (if implementing tests - optional)
- [ ] T004 [P] Verify TypeScript configuration in tsconfig.json (ESM modules, strict mode, Constatic path aliases already configured)
- [ ] T005 [P] Configure ESLint with @typescript-eslint parser and recommended rules
- [ ] T006 [P] Configure Prettier for code formatting
- [ ] T007 [P] Configure Jest with ts-jest preset (optional - only if implementing tests) in jest.config.js
- [ ] T008 Verify project structure follows Constatic conventions: src/discord/, src/services/, src/database/, tests/
- [ ] T009 Update .env.example with all required environment variables (BOT_TOKEN, MERCADOPAGO_ACCESS_TOKEN, WEBHOOK_URL, ADMIN_USER_ID, DATABASE_URL, pricing defaults)
- [ ] T010 [P] Verify npm scripts in package.json: dev (tsx watch), build (tsup), start, test (if tests), lint, format
- [ ] T011 [P] Update .gitignore to include: node_modules/, build/, .env, prisma/*.db, prisma/*.db-journal, logs/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Foundation

- [ ] T012 Create Prisma schema models in prisma/models/ directory: ticket.prisma, order.prisma, payment.prisma, priceConfig.prisma, statusHistory.prisma, paymentWebhook.prisma per contracts/database.md
- [ ] T013 Configure main prisma/schema.prisma with datasource (provider: sqlite), generator (prisma-client-js), and model imports
- [ ] T014 Create initial Prisma migration in prisma/migrations/ using `npx prisma migrate dev --name initial_schema`
- [ ] T015 Create database seeder script in prisma/seed.ts for PriceConfig default values (sheet: R$5, ink: R$2, lamination: R$1.50, deckbox: R$15, sleeves: R$10)
- [ ] T016 [P] Unit test for Prisma client in tests/unit/database/prisma.test.ts (test connection, basic queries) - optional
- [ ] T017 [P] Integration test for schema migrations in tests/integration/database/migrations.test.ts (verify all tables, indexes created) - optional

### Configuration & Logging

- [ ] T018 [P] Update environment configuration in src/env.ts using Constatic's validateEnv() with Zod schema (add Mercado Pago tokens, pricing defaults, webhook URL)
- [ ] T019 [P] Update application constants in src/constants.ts (ticket status enums, payment status enums, timeouts: 24h expiration, retry delays: 1s/2s/4s)
- [ ] T020 [P] Create logger utility in src/utils/logger.ts (optional Discord webhook logging per research.md, console logging for development)
- [ ] T021 [P] Unit test for env validation in tests/unit/env.test.ts (test missing vars, invalid formats) - optional

### Discord Bot Core

- [ ] T022 Verify Constatic bootstrap in src/index.ts (bootstrap() function already imports meta and env per research.md)
- [ ] T023 Verify command auto-loading from src/discord/commands/ (Constatic's createCommand() pattern per research.md)
- [ ] T024 Verify interaction handler auto-loading from src/discord/responders/ (Constatic's createResponder() pattern per research.md)
- [ ] T025 [P] Create embed builder utilities in src/discord/embeds.ts (standard message formats, colors, footers)
- [ ] T026 [P] Create permission checker utility in src/discord/permissions.ts (isAdmin function checking against env.ADMIN_USER_ID)
- [ ] T027 [P] Unit test for permission checker in tests/unit/discord/permissions.test.ts - optional

### Express Webhook Server

- [ ] T028 Create Express server setup in src/server/index.ts using Constatic's server preset (POST endpoint /webhooks/mercadopago)
- [ ] T029 Create webhook signature validator in src/server/routes/webhooks.ts (Mercado Pago signature verification using x-signature header)
- [ ] T030 [P] Integration test for webhook endpoint in tests/integration/webhook/server.test.ts (test valid/invalid signatures) - optional

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Sistema Básico de Tickets (Priority: P1) 🎯 MVP

**Goal**: Enable customers to create ticket channels via button click. Enforce one-ticket-per-user rule.

**Independent Test**: Create ticket via button → verify channel created in correct category → confirm user has access → verify rejection when user has active ticket

### Tests for User Story 1 (Optional - Recommended for Quality) ✓

> **CONSTITUTION GUIDANCE**: Tests are optional per Constitution v2.0.0, Principle I (Unit Testing - Encouraged). However, they are strongly recommended for production systems. If implementing tests, follow test-first development (write tests before implementation) per Principle IV for better design. **These test tasks (T031-T036) can be skipped if desired.**

- [ ] T031 [P] [US1] Unit tests for TicketService in tests/unit/services/TicketService.test.ts (test createTicket logic, one-ticket-per-user enforcement, Prisma mocks)
- [ ] T032 [P] [US1] Contract test for /setup command in tests/contract/commands/setup.test.ts (test parameter validation, response format per contracts/commands.md)
- [ ] T033 [P] [US1] Contract test for create-ticket button interaction in tests/contract/interactions/createTicket.test.ts (test button response, ephemeral messages)
- [ ] T034 [US1] Integration test for ticket creation flow in tests/integration/ticket-creation-flow.test.ts (test full flow from button click to channel creation with in-memory SQLite database)
- [ ] T035 [P] [US1] Unit tests for category manager utility in tests/unit/discord/categoryManager.test.ts
- [ ] T036 [P] [US1] Unit tests for permission checker in tests/unit/discord/permissions.test.ts

### Implementation for User Story 1

- [ ] T037 [US1] Create TicketService in src/services/ticket.ts (direct Prisma Client usage: prisma.ticket.create(), prisma.ticket.findFirst() for active ticket check, enforce one-ticket rule per FR-004A)
- [ ] T038 [US1] Add Discord channel creation logic to TicketService (createChannel with permissions, category assignment, welcome message embed)
- [ ] T039 [US1] Create /setup command in src/discord/commands/public/setup.ts using createCommand() pattern (admin-only, store category IDs in memory/database, post ticket button)
- [ ] T040 [US1] Create create-ticket button responder in src/discord/responders/buttons/createTicket.ts using createResponder() pattern (check active ticket via Prisma, call TicketService, show rejection message if active ticket exists)
- [ ] T041 [P] [US1] Add category manager utility in src/discord/categoryManager.ts (moveChannelToCategory helper with error handling)
- [ ] T042 [P] [US1] Add ticket welcome message embed builder in src/discord/embeds.ts (welcomeMessage function)
- [ ] T043 [US1] Add logging for all ticket operations (creation, rejection, errors) using logger utility
- [ ] T044 [US1] Verify US1 implementation works correctly (manual testing or run automated tests if implemented)

**Checkpoint**: User Story 1 complete - users can create tickets, one-ticket rule enforced, channels organized

---

## Phase 4: User Story 2 - Formulário de Pedido (Priority: P2)

**Goal**: Collect order information via interactive form: extras (select menu), card count (message collector), decklist URL (message collector with validation)

**Independent Test**: In a ticket channel → click "Iniciar Pedido" → select extras → enter card count → enter decklist URL → verify all data stored

### Tests for User Story 2 (Optional - Recommended for Quality) ✓

> **CONSTITUTION GUIDANCE**: Tests are optional but recommended. **These test tasks (T045-T050) can be skipped if desired.**

- [ ] T045 [P] [US2] Unit tests for OrderService in tests/unit/services/OrderService.test.ts (test form state management, validation logic, URL regex, Prisma mocks)
- [ ] T046 [P] [US2] Unit tests for validation utility in tests/unit/utils/validation.test.ts (test card count bounds 1-1000, URL regex patterns: ^https?://)
- [ ] T047 [P] [US2] Contract test for start-order button in tests/contract/interactions/startOrder.test.ts (test select menu format per contracts/commands.md)
- [ ] T048 [P] [US2] Contract test for extras select menu in tests/contract/interactions/selectExtras.test.ts
- [ ] T049 [US2] Integration test for order form flow in tests/integration/order-form-flow.test.ts (test full form workflow with valid/invalid inputs using in-memory database)
- [ ] T050 [P] [US2] Unit tests for sheet count calculator in tests/unit/utils/calculator.test.ts (test ceil(cards/9) formula)

### Implementation for User Story 2

- [ ] T051 [P] [US2] Create validation utility in src/utils/validation.ts (validateCardCount: 1-1000, validateDecklistUrl: regex ^https?://)
- [ ] T052 [P] [US2] Create sheet calculator utility in src/utils/calculator.ts (calculateSheetCount: Math.ceil(quantity / 9))
- [ ] T053 [US2] Create OrderService in src/services/order.ts (manage form state in memory Map<channelId, FormData>, direct Prisma: prisma.order.create(), handle collectors, validation)
- [ ] T054 [US2] Create start-order button responder in src/discord/responders/buttons/startOrder.ts (show extras select menu using StringSelectMenuBuilder)
- [ ] T055 [US2] Create extras select menu responder in src/discord/responders/selects/selectExtras.ts (store selection, update ticket to COLLECTING status, prompt for card count)
- [ ] T056 [US2] Add message collector for card count in OrderService with validation and retry on invalid input (show error per FR-007)
- [ ] T057 [US2] Add message collector for decklist URL in OrderService with regex validation (show error: "URL inválida..." per FR-008A)
- [ ] T058 [US2] Persist order to database when form completes (prisma.order.create with all collected data)
- [ ] T059 [US2] Add form timeout handling (cancel after 10 minutes of inactivity, cleanup memory state)
- [ ] T060 [US2] Verify US2 implementation works correctly (manual testing or run automated tests if implemented)

**Checkpoint**: User Story 2 complete - order forms collect all required information with validation

---

## Phase 5: User Story 3 - Cálculo de Preço e Pagamento (Priority: P3)

**Goal**: Calculate order price using formula (sheets = ceil(cards/9), total = materials + extras), generate Mercado Pago Pix payment with QR code, implement 24-hour timeout with 1-hour warning

**Independent Test**: Provide order data → verify price calculation → confirm Pix key and QR code generated → verify timeout warnings and expiration

### Tests for User Story 3 (Optional - Recommended for Quality) ✓

> **CONSTITUTION GUIDANCE**: Tests are optional but recommended, especially for payment logic. **These test tasks (T061-T070) can be skipped if desired.**

- [ ] T061 [P] [US3] Unit tests for price calculator in tests/unit/utils/calculator.test.ts (test sheet calculation, pricing formula with all combinations from quickstart.md table)
- [ ] T062 [P] [US3] Unit tests for PaymentService in tests/unit/services/PaymentService.test.ts (test Mercado Pago API calls with mocks, retry logic, error handling)
- [ ] T063 [P] [US3] Unit tests for retry utility in tests/unit/utils/retry.test.ts (test exponential backoff: 1s, 2s, 4s delays)
- [ ] T064 [P] [US3] Unit tests for TimeoutScheduler in tests/unit/services/TimeoutScheduler.test.ts (test 23h warning, 24h expiration logic)
- [ ] T065 [P] [US3] Contract test for Mercado Pago API in tests/contract/mercadopago.test.ts (test request/response format, QR code generation)
- [ ] T066 [P] [US3] Contract test for /config-pricing command in tests/contract/commands/configPricing.test.ts
- [ ] T067 [US3] Integration test for payment generation flow in tests/integration/payment-flow.test.ts (test full flow with Mercado Pago mock, database operations)
- [ ] T068 [US3] Integration test for payment timeout scheduler in tests/integration/payment-timeout.test.ts (test cron job execution, notifications)
- [ ] T069 [P] [US3] Unit tests for PriceConfig operations in tests/unit/services/pricing.test.ts (test singleton pattern, Prisma operations)
- [ ] T070 [P] [US3] Unit tests for notification service in tests/unit/services/notification.test.ts

### Implementation for User Story 3

- [ ] T071 [P] [US3] Extend price calculator in src/utils/calculator.ts (calculateTotalPrice: sheets × price + ink + lamination + extras per data-model.md formula)
- [ ] T072 [P] [US3] Create retry wrapper utility in src/utils/retry.ts (exponentialBackoff function: 3 attempts, 1s/2s/4s delays with jitter per research.md)
- [ ] T073 [US3] Create PaymentService in src/services/payment.ts (Mercado Pago SDK integration: generatePixPayment with retry wrapper, direct Prisma: prisma.payment.create())
- [ ] T074 [US3] Create PricingService in src/services/pricing.ts (getPriceConfig, updatePriceConfig using direct Prisma: prisma.priceConfig.findUnique(), prisma.priceConfig.update())
- [ ] T075 [US3] Create /config-pricing command in src/discord/commands/public/configPricing.ts (admin-only, update price_config table, show example calculation embed)
- [ ] T076 [US3] Add payment generation to OrderService.completeForm() (load PriceConfig, calculate price, call PaymentService, show Pix key + QR code embed, update ticket to PENDING)
- [ ] T077 [US3] Create TimeoutScheduler service in src/services/timeout.ts (node-cron: every 10 minutes, query pending payments via Prisma, check expiresAt timestamps)
- [ ] T078 [US3] Add 1-hour warning notification in TimeoutScheduler (send DM to user: "Atenção: Seu pagamento expira em 1 hora...")
- [ ] T079 [US3] Add 24-hour expiration handler in TimeoutScheduler (update ticket to EXPIRED, archive channel, send final message per FR-023C)
- [ ] T080 [US3] Add error handling for Mercado Pago failures (user-friendly message, admin DM notification per NFR-002, NFR-004)
- [ ] T081 [US3] Move channel to PENDENTES category when payment generated (use categoryManager utility)
- [ ] T082 [US3] Add payment embed builder in src/discord/embeds.ts (paymentMessage with Pix key, QR code, amount, expiration time)
- [ ] T083 [US3] Verify US3 implementation works correctly (manual testing or run automated tests if implemented)

**Checkpoint**: User Story 3 complete - payments generated with QR codes, timeouts enforced

---

## Phase 6: User Story 4 - Processamento de Pagamento (Priority: P4)

**Goal**: Monitor payment status via Mercado Pago webhooks, update ticket status on approval, handle refunds/cancellations, notify admin

**Independent Test**: Simulate webhook → verify status update → confirm channel moved → verify admin notification → test refund webhook

### Tests for User Story 4 (Optional - Recommended for Quality) ✓

> **CONSTITUTION GUIDANCE**: Tests are optional but recommended for webhook handling. **These test tasks (T084-T089) can be skipped if desired.**

- [ ] T084 [P] [US4] Unit tests for webhook handler in tests/unit/services/webhook.test.ts (test signature validation, payment lookup via Prisma, status transitions)
- [ ] T085 [P] [US4] Unit tests for NotificationService in tests/unit/services/notification.test.ts (test admin DM formatting, error handling)
- [ ] T086 [P] [US4] Contract test for webhook endpoint in tests/contract/webhook/mercadopago.test.ts (test webhook payload format per Mercado Pago docs)
- [ ] T087 [US4] Integration test for payment approval flow in tests/integration/payment-approval-flow.test.ts (webhook → status update → channel move → admin notification using in-memory database)
- [ ] T088 [US4] Integration test for payment refund flow in tests/integration/payment-refund-flow.test.ts (refund webhook → cancellation → archive)
- [ ] T089 [P] [US4] Unit tests for webhook audit logging in tests/unit/services/webhook-audit.test.ts

### Implementation for User Story 4

- [ ] T090 [US4] Create WebhookService in src/services/webhook.ts (validate signature, log webhook to payment_webhooks via Prisma, route to payment status handler)
- [ ] T091 [US4] Add payment approval handler to PaymentService (prisma.payment.update status to APPROVED, prisma.ticket.update to APPROVED, move channel to APROVADO)
- [ ] T092 [US4] Add payment refund/cancellation handler to PaymentService (update to CANCELLED via Prisma, archive channel, notify customer and admin per FR-019D)
- [ ] T093 [US4] Create NotificationService in src/services/notification.ts (sendAdminDM method with order details embed, error handling if DMs disabled)
- [ ] T094 [US4] Add payment status message updater (edit original payment message: "🔄 Processando..." → "✅ APROVADO" with timestamp)
- [ ] T095 [US4] Add webhook audit logging (prisma.paymentWebhook.create with full payload, processed flag, error_message field)
- [ ] T096 [US4] Create webhook route handler in src/server/routes/webhooks.ts (verify signature, call WebhookService, return 200 OK)
- [ ] T097 [US4] Add status history tracking in WebhookService (prisma.statusHistory.create for PENDING → APPROVED transition)
- [ ] T098 [US4] Integrate TimeoutScheduler with webhook processing (cancel timeout when payment approved)
- [ ] T099 [US4] Verify US4 implementation works correctly (manual testing with Mercado Pago webhooks or run automated tests if implemented)

**Checkpoint**: User Story 4 complete - payments automatically processed, admin notified

---

## Phase 7: User Story 5 - Painel Administrativo (Priority: P5)

**Goal**: Admin can list orders by status, mark as ready for delivery, mark as delivered for archival

**Independent Test**: Run /list-orders → verify filtering → click "Marcar Pronto" → verify status change → click "Marcar Entregue" → verify archival

### Tests for User Story 5 (Optional - Recommended for Quality) ✓

> **CONSTITUTION GUIDANCE**: Tests are optional but recommended for admin operations. **These test tasks (T100-T105) can be skipped if desired.**

- [ ] T100 [P] [US5] Unit tests for AdminService in tests/unit/services/AdminService.test.ts (test listOrders filtering via Prisma, status transitions, permission checks)
- [ ] T101 [P] [US5] Contract test for /list-orders command in tests/contract/commands/listOrders.test.ts (test embed format, button layout per contracts/commands.md)
- [ ] T102 [P] [US5] Contract test for admin buttons in tests/contract/interactions/adminButtons.test.ts (mark-ready, mark-delivered buttons)
- [ ] T103 [US5] Integration test for admin workflow in tests/integration/admin-flow.test.ts (test full lifecycle: list → mark ready → mark delivered using in-memory database)
- [ ] T104 [P] [US5] Unit tests for status history tracking in tests/unit/services/history.test.ts
- [ ] T105 [P] [US5] Unit tests for channel archival in tests/unit/discord/archiveChannel.test.ts

### Implementation for User Story 5

- [ ] T106 [US5] Create AdminService in src/services/admin.ts (listOrders: prisma.ticket.findMany with status filter, markReady: prisma.ticket.update to READY, markDelivered: prisma.ticket.update to DELIVERED)
- [ ] T107 [US5] Create HistoryService in src/services/history.ts (trackStatusChange: prisma.statusHistory.create with old/new status, changed_by, timestamp)
- [ ] T108 [US5] Create /list-orders command in src/discord/commands/public/listOrders.ts (admin-only, query orders via AdminService, build paginated embed with action buttons)
- [ ] T109 [US5] Create mark-ready button responder in src/discord/responders/buttons/markReady.ts (call AdminService.markReady, track history, notify customer)
- [ ] T110 [US5] Create mark-delivered button responder in src/discord/responders/buttons/markDelivered.ts (call AdminService.markDelivered, track history, initiate channel archival)
- [ ] T111 [P] [US5] Add permission checks to admin commands (verify interaction.user.id === env.ADMIN_USER_ID, show error if unauthorized)
- [ ] T112 [US5] Integrate status history tracking in all status transitions (call HistoryService after Prisma ticket.update operations)
- [ ] T113 [P] [US5] Create channel archival utility in src/discord/archiveChannel.ts (lock channel permissions, add final message, archive after 1 hour delay)
- [ ] T114 [US5] Add customer notification on status changes (DM user when ticket marked READY: "✅ Seu pedido está pronto para entrega!")
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
npx prisma migrate dev --name initial_schema && npx prisma generate

# Terminal 2: Configuration  
npm run lint src/env.ts && npm run lint src/constants.ts

# Terminal 3: Discord Core
npm run lint src/discord/ && npm run dev

# Terminal 4: Webhook Server
npm run lint src/server/ && npm test -- tests/integration/webhook/ (if tests)
```

### User Story 1 (Services + Utilities in parallel)
```bash
# Terminal 1: TicketService implementation
npm run dev -- --watch src/services/ticket.ts

# Terminal 2: Category manager utility
npm run dev -- --watch src/discord/categoryManager.ts

# Terminal 3: Permission checker
npm run dev -- --watch src/discord/permissions.ts

# Terminal 4: Run tests (if implementing)
npm test -- tests/unit/services/TicketService.test.ts --watch
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

- ✓ **Principle I (Unit Testing - Encouraged)**: 42 optional test tasks (T016, T017, T021, T027, T030, T031-T036, T045-T050, T061-T070, T084-T089, T100-T105, T121) - can be skipped per Constitution v2.0.0
- ✓ **Principle II (Simplicity First)**: Direct Prisma Client usage (no repository abstraction per post-design re-evaluation), Constatic conventions, standard SDKs (Mercado Pago, discord.js)
- ✓ **Principle III (Best Practices)**: TypeScript strict mode (verified T004), ESLint (T005), Prisma type safety, error handling (T080, T116), logging (T020, T043)
- ✓ **Principle IV (Test-First)**: Test-first workflow available for developers who choose to implement tests (optional per Constitution)
- ✓ **Principle V (User Story Independence)**: Each phase 3-7 can be deployed independently per quickstart.md, no cross-story blocking dependencies

---

## Task Summary

- **Total Tasks**: 115
- **Setup Tasks**: 11 (T001-T011)
- **Foundation Tasks**: 19 (T012-T030)
- **User Story 1 Tasks**: 14 (T031-T044)
- **User Story 2 Tasks**: 16 (T045-T060)
- **User Story 3 Tasks**: 19 (T061-T083)  
- **User Story 4 Tasks**: 16 (T084-T099)
- **User Story 5 Tasks**: 16 (T100-T115)
- **Polish Tasks**: 13 (T116-T128)

**Parallelizable Tasks**: 52 tasks marked with [P] (45% of total)

**Optional Test Tasks**: 42 test tasks (T016, T017, T021, T027, T030, T031-T036, T045-T050, T061-T070, T084-T089, T100-T105, T121)

**Independent Deliverables**: 5 user stories, each fully functional and testable on its own

**Key Architecture Decisions**:
- ✅ Constatic framework for Discord bot structure (convention over configuration)
- ✅ Prisma ORM with SQLite for type-safe database access (no repository abstraction - direct Prisma Client)
- ✅ Mercado Pago SDK for payment integration
- ✅ Express server (via Constatic preset) for webhooks
- ✅ node-cron for payment timeout monitoring
- ✅ Simplicity First: Direct Prisma queries, no complex patterns (per Constitution post-design re-evaluation)

---

**Generated**: 2026-02-24  
**Command**: `/speckit.tasks`  
**Next Step**: Begin implementation starting with Phase 1 (Setup)
