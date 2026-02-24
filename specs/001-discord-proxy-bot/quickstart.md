# Quick Start Guide: Discord Proxy Bot

**Version**: 1.0  
**Date**: 2026-02-24  
**Purpose**: Rapidamente testar cada user story de forma independente

## Overview

Este guia fornece instruções para testar cada funcionalidade do bot de forma independente, seguindo o Princípio V (User Story Independence) da constituição. Cada seção pode ser testada isoladamente sem dependência das outras.

---

## Prerequisites

### Development Environment

```bash
# Node.js 18+ LTS required
node --version  # Should be 18.x or higher

# Clone repository (if not done yet)
git clone <repository-url>
cd ProxyTickets

# Install dependencies
npm install

# Copy environment file
cp config/.env.example config/.env

# Edit .env with your credentials
# Required: DISCORD_TOKEN, DISCORD_CLIENT_ID, MERCADOPAGO_ACCESS_TOKEN, etc.
```

### Discord Bot Setup

1. Create Discord Application at https://discord.com/developers/applications
2. Enable Bot and get token
3. Enable these Privileged Gateway Intents:
   - SERVER MEMBERS INTENT
   - MESSAGE CONTENT INTENT
4. Invite bot to your test server with permissions:
   - Manage Channels
   - Manage Roles
   - Send Messages
   - Embed Links
   - Attach Files
   - Read Message History
   - Add Reactions

### Mercado Pago Setup

1. Create account at https://www.mercadopago.com.br
2. Get Access Token from Dashboard → Developers → Credentials
3. Set up webhook URL (use ngrok for local development):
   ```bash
   npx ngrok http 3000
   # Copy HTTPS URL to WEBHOOK_URL in .env
   ```

---

## Running the Bot

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

---

## User Story 1: Sistema Básico de Tickets (P1)

**Goal**: Create tickets via button click and manage ticket channels

### Setup

1. Create 3 categories in your Discord server:
   - `=== TICKETS NOVOS ===`
   - `=== PENDENTES ===`
   - `=== APROVADO ===`

2. Create channels:
   - `#criar-ticket` (where button will be posted)
   - `#admin-panel` (private admin channel)

### Test Steps

```bash
# 1. Start the bot
npm run dev

# 2. Run setup command in Discord
/setup 
  ticket_channel: #criar-ticket
  new_category: === TICKETS NOVOS ===
  pending_category: === PENDENTES ===
  approved_category: === APROVADO ===
  admin_channel: #admin-panel
```

**Expected Results**:
- ✅ Message with "🎫 Criar Ticket" button appears in `#criar-ticket`
- ✅ Welcome message sent to `#admin-panel`

### Test Ticket Creation

1. Click "🎫 Criar Ticket" button in `#criar-ticket`
2. **Expected**:
   - ✅ New channel created in "=== TICKETS NOVOS ===" category
   - ✅ Channel named `ticket-{username}-###`
   - ✅ User can see the channel
   - ✅ Welcome message with "📝 Iniciar Pedido" button appears

3. Test multiple tickets:
   - Create 2nd ticket from different user
   - **Expected**: Each user gets separate ticket channel

### Test Validation

Run unit tests:
```bash
npm test -- tests/unit/services/TicketService.test.ts
```

**Success Criteria**:
- Can create ticket in < 1 second
- Each ticket gets unique channel
- Permissions correctly set
- Welcome message formatted correctly

---

## User Story 2: Formulário de Pedido (P2)

**Goal**: Collect order information via interactive form

### Prerequisites

- User Story 1 completed (ticket creation working)
- At least one active ticket channel

### Test Steps

1. In any ticket channel, click "📝 Iniciar Pedido"
2. **Expected**: Select menu with extras appears

3. Select extras (test all combinations):
   - ☐ None selected
   - ☑️ Only "Deck Box"
   - ☑️ Only "Sleeves"  
   - ☑️ Both selected

4. **Expected**: Prompt for card count appears

5. Enter card count:
   ```
   Test inputs:
   - 100 (valid - Commander standard)
   - 60 (valid - Standard deck)
   - 0 (invalid - should reject)
   - -5 (invalid - should reject)
   - abc (invalid - should reject)
   - 1001 (invalid - exceeds limit)
   ```

6. **Expected**: 
   - Valid input: Prompt for decklist URL
   - Invalid input: Error message + re-prompt

7. Enter decklist URL:
   ```
   Test inputs:
   - https://ligamagic.com.br/?view=deck/list&id=12345 (valid)
   - https://moxfield.com/decks/abc123 (valid)
   - not-a-url (invalid)
   - http://example.com (valid URL format)
   ```

8. **Expected**: Form submission triggers next phase

### Test Validation

```bash
# Unit tests for form validation
npm test -- tests/unit/services/OrderService.test.ts

# Integration test for full form flow
npm test -- tests/integration/order-form-flow.test.ts
```

**Success Criteria**:
- All input validation works correctly
- Form state persisted between steps
- Error messages clear and helpful
- Can complete form in < 2 minutes

---

## User Story 3: Cálculo de Preço e Pagamento (P3)

**Goal**: Calculate price and generate Pix payment

### Prerequisites

- User Stories 1 & 2 completed
- Mercado Pago credentials configured in `.env`

### Test Price Calculation

```bash
# Unit test for pricing calculator
npm test -- tests/unit/utils/calculator.test.ts
```

**Test Cases**:

| Cards | Extras | Expected Sheets | Expected Price¹ |
|-------|--------|-----------------|-----------------|
| 100 | None | 12 | R$ 68,50 |
| 100 | Deck Box | 12 | R$ 83,50 |
| 100 | Sleeves | 12 | R$ 78,50 |
| 100 | Both | 12 | R$ 93,50 |
| 91 | None | 11 | R$ 63,50 |
| 9 | None | 1 | R$ 8,50 |
| 1 | None | 1 | R$ 8,50 |

¹ Based on default prices: Sheet R$ 5, Ink R$ 2, Lamination R$ 1.50, Deck Box R$ 15, Sleeves R$ 10

**Formula**:
```typescript
sheets = Math.ceil(cards / 9)
material = (sheets × 5.00) + 2.00 + 1.50
extras = (deckbox ? 15.00 : 0) + (sleeves ? 10.00 : 0)
total = material + extras
```

### Test Payment Generation

1. Complete form in ticket channel (US2)
2. **Expected**: Payment message appears with:
   - ✅ Order summary (cards, extras, prices)
   - ✅ Total calculated correctly
   - ✅ Pix key (copy-paste format)
   - ✅ QR Code image from Mercado Pago
   - ✅ Status: "🔄 Processando..."

3. **Expected**: Channel moved to "=== PENDENTES ===" category

### Test Configuration Updates

```bash
# In Discord, run:
/config-pricing
  sheet_price: 6.00
  ink_cost: 2.50

# Create new order and verify new prices are used
```

### Test Validation

```bash
# Integration test for payment flow
npm test -- tests/integration/payment-flow.test.ts

# Contract test for Mercado Pago API
npm test -- tests/contract/mercadopago.test.ts
```

**Success Criteria**:
- Pricing calculation 100% accurate
- QR Code successfully generated
- Pix key valid format
- Payment message formatted correctly
- Config updates apply to new orders

---

## User Story 4: Processamento de Pagamento (P4)

**Goal**: Monitor payment and update status automatically

### Prerequisites

- User Stories 1, 2, 3 completed
- Webhook endpoint accessible (ngrok for local testing)

### Test Webhook Processing

**Option A: Use Mercado Pago Test Environment**

1. Use test credentials in `.env`:
   ```env
   MERCADOPAGO_ACCESS_TOKEN=TEST-...
   ```

2. Make test payment from Mercado Pago dashboard

3. **Expected**: Webhook received and processed

**Option B: Simulate Webhook Locally**

```bash
# In separate terminal, send mock webhook:
curl -X POST http://localhost:3000/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -d '{
    "action": "payment.updated",
    "data": { "id": "12345678" },
    "type": "payment"
  }'
```

### Expected Behavior

1. Webhook received and logged to `payment_webhooks` table
2. Payment status updated: PENDING → APPROVED
3. Ticket channel moved to "=== APROVADO ===" category
4. Payment message updated:
   - "🔄 Processando..." → "✅ APROVADO"
   - Approval timestamp added
5. Admin receives DM notification:
   ```
   🔔 Novo pedido aprovado!
   🎫 Ticket: #001
   👤 Cliente: @username
   ...
   ```

### Test Error Handling

```bash
# Test invalid webhook signature
curl -X POST http://localhost:3000/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -H "x-signature: invalid-signature" \
  -d '{"action": "payment.updated"}'

# Expected: 400 Bad Request
```

### Test Validation

```bash
# Unit test for webhook handler
npm test -- tests/unit/services/PaymentService.test.ts

# Integration test for complete payment flow
npm test -- tests/integration/payment-approval-flow.test.ts
```

**Success Criteria**:
- Webhook processed in < 2 minutes
- Admin notified within 30 seconds
- Channel category updated correctly
- Payment message updated correctly
- Audit trail in database

---

## User Story 5: Painel Administrativo (P5)

**Goal**: Admin can manage order lifecycle

### Prerequisites

- At least one approved order (US4 completed)
- Admin user ID configured in `.env`

### Test List Orders

```bash
# In Discord (as admin):
/list-orders status:approved

# Expected: Embed with approved orders showing:
# - Ticket number
# - Customer username
# - Order details (cards, extras)
# - Total price
# - Decklist link
# - Buttons: [Marcar Pronto] [Ver Detalhes]
```

**Test Filters**:
```bash
/list-orders status:approved   # Show approved only
/list-orders status:ready      # Show ready for delivery
/list-orders status:delivered  # Show delivered
/list-orders status:all        # Show all orders
```

### Test Mark as Ready

1. Click "✅ Marcar Pronto" on an approved order
2. **Expected**:
   - Ticket status: APPROVED → READY
   - Channel moved to appropriate category
   - Message sent to ticket channel: "🎉 Seu pedido está pronto!"
   - Button updated to "📦 Marcar Entregue"
   - Admin receives confirmation

### Test Mark as Delivered

1. Click "📦 Marcar Entregue" on a ready order
2. **Expected**:
   - Ticket status: READY → DELIVERED
   - Final message sent to ticket channel
   - Channel archived after 1 hour
   - Order moved to archive table
   - History entry created

### Test Permission Checks

```bash
# As non-admin user, try:
/list-orders

# Expected: ❌ Permission denied error
```

```bash
# As non-admin, click admin buttons
# Expected: ❌ Error message (interaction failed)
```

### Test Validation

```bash
# Unit test for admin service
npm test -- tests/unit/services/AdminService.test.ts

# Integration test for admin workflow
npm test -- tests/integration/admin-flow.test.ts
```

**Success Criteria**:
- Only admin can access commands
- Orders filtered correctly
- Status transitions work correctly
- Notifications sent correctly
- Channels archived properly

---

## End-to-End Testing

### Complete Flow Test

**Scenario**: Customer creates order → pays → admin delivers

```bash
# Run E2E test suite
npm run test:e2e

# Or manual testing:
# 1. Create ticket (US1)
# 2. Fill form (US2)
# 3. Verify price (US3)
# 4. Simulate payment (US4)
# 5. Mark ready & delivered (US5)
```

**Expected Total Time**: < 5 minutes for complete flow

---

## Database Inspection

### SQLite CLI

```bash
# Open database
sqlite3 database/proxytickets.db

# Check tables
.tables

# Query active tickets
SELECT t.id, t.channel_id, t.status, o.total_price 
FROM tickets t 
LEFT JOIN orders o ON t.id = o.ticket_id 
WHERE t.status NOT IN ('DELIVERED', 'CANCELLED');

# Check price config
SELECT * FROM price_config;

# View admin dashboard
SELECT * FROM v_admin_dashboard;

# Exit
.quit
```

### Database Viewer (GUI)

```bash
# Install DB Browser for SQLite
# https://sqlitebrowser.org/

# Open database/proxytickets.db
```

---

## Troubleshooting

### Bot Not Starting

```bash
# Check environment variables
cat config/.env | grep DISCORD_TOKEN

# Check Node version
node --version  # Must be 18+

# Check dependencies
npm install

# View logs
tail -f logs/combined.log
```

### Commands Not Registering

```bash
# Manually register commands
npm run register-commands

# Check bot permissions in Discord server
# Ensure slash command permission enabled
```

### Webhook Not Receiving

```bash
# Check ngrok is running
curl https://your-ngrok-url.ngrok.io/health

# Check Mercado Pago webhook configuration
# Ensure URL is HTTPS

# Test webhook locally
curl -X POST http://localhost:3000/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -d '{"action":"payment.updated","data":{"id":"123"}}'
```

### Database Locked

```bash
# If "database is locked" error:
# Check for long-running queries
# Enable WAL mode:
sqlite3 database/proxyticets.db "PRAGMA journal_mode=WAL;"
```

---

## Performance Benchmarks

### Expected Performance

| Operation | Target Time | Measured |
|-----------|-------------|----------|
| Create ticket | < 1s | _____ |
| Complete form | < 3min | _____ |
| Generate payment | < 2s | _____ |
| Process webhook | < 2min | _____ |
| Update status | < 500ms | _____ |
| List orders | < 1s | _____ |

### Load Testing

```bash
# Simulate 10 concurrent ticket creations
npm run test:load -- --tickets=10

# Simulate 100 webhook deliveries
npm run test:load -- --webhooks=100
```

---

## Cleanup

### Reset Test Data

```bash
# Delete all test tickets
npm run cleanup:tickets

# Reset database (WARNING: Deletes all data)
rm database/proxytickets.db
npm run migrate
```

### Reset Bot Configuration

```bash
# Unregister commands
npm run unregister-commands

# Delete setup data
# (Run /setup again to reconfigure)
```

---

## Next Steps

After successfully testing all user stories:

1. ✅ Review [data-model.md](data-model.md) for database schema
2. ✅ Review [contracts/commands.md](contracts/commands.md) for command interfaces
3. ✅ Review [contracts/database.md](contracts/database.md) for SQL schema
4. ✅ Run `/speckit.tasks` to generate implementation tasks
5. ✅ Begin implementation phase

---

## Support

- **Documentation**: See `/specs/001-discord-proxy-bot/`
- **Issues**: Check `tests/` for example usage
- **Discord**: #desenvolvimento channel (if applicable)
- **Logs**: `logs/combined.log` and `logs/error.log`
