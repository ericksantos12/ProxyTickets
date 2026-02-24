# Database Schema Contract: Discord Proxy Bot

**Version**: 1.0  
**Date**: 2026-02-24  
**Database**: SQLite 3  
**Migration**: 001_initial.sql

## Complete SQL Schema

```sql
-- ============================================================================
-- ProxyTickets Database Schema v1
-- SQLite 3.x Compatible
-- ============================================================================

-- Enable foreign key constraints (required for SQLite)
PRAGMA foreign_keys = ON;

-- ============================================================================
-- TABLE: tickets
-- Purpose: Track Discord ticket channels and their lifecycle
-- ============================================================================

CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(
    status IN (
      'NEW',
      'COLLECTING',
      'PENDING_PAYMENT',
      'PAYMENT_PROCESSING',
      'APPROVED',
      'READY',
      'DELIVERED',
      'CANCELLED'
    )
  ),
  category_id TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at DATETIME NULL
);

-- Indexes for tickets
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);

-- ============================================================================
-- TABLE: orders
-- Purpose: Store order details (cards, extras, pricing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL UNIQUE,
  card_count INTEGER NOT NULL CHECK(card_count > 0 AND card_count <= 1000),
  decklist_url TEXT NOT NULL,
  include_deckbox BOOLEAN NOT NULL DEFAULT 0,
  include_sleeves BOOLEAN NOT NULL DEFAULT 0,
  sheet_count INTEGER NOT NULL,
  total_price REAL NOT NULL CHECK(total_price >= 0),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

-- Indexes for orders
CREATE INDEX idx_orders_ticket_id ON orders(ticket_id);

-- ============================================================================
-- TABLE: payments
-- Purpose: Track payment status and Mercado Pago integration
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL UNIQUE,
  amount REAL NOT NULL CHECK(amount > 0),
  pix_key TEXT NOT NULL,
  qr_code_url TEXT NOT NULL,
  mercadopago_payment_id TEXT UNIQUE NULL,
  mercadopago_preference_id TEXT UNIQUE NULL,
  status TEXT NOT NULL CHECK(
    status IN (
      'PENDING',
      'PROCESSING',
      'APPROVED',
      'REJECTED',
      'CANCELLED',
      'REFUNDED'
    )
  ),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at DATETIME NULL,
  cancelled_at DATETIME NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Indexes for payments
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_mp_payment_id ON payments(mercadopago_payment_id);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- ============================================================================
-- TABLE: payment_webhooks
-- Purpose: Audit trail of all Mercado Pago webhook events
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_webhooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id INTEGER NOT NULL,
  mercadopago_event_type TEXT NOT NULL,
  mercadopago_action TEXT NOT NULL,
  payload TEXT NOT NULL,
  received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed BOOLEAN NOT NULL DEFAULT 0,
  error_message TEXT NULL,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
);

-- Indexes for payment_webhooks
CREATE INDEX idx_webhooks_payment_id ON payment_webhooks(payment_id);
CREATE INDEX idx_webhooks_processed ON payment_webhooks(processed);
CREATE INDEX idx_webhooks_received_at ON payment_webhooks(received_at DESC);

-- ============================================================================
-- TABLE: price_config
-- Purpose: Singleton configuration for material and extra pricing
-- ============================================================================

CREATE TABLE IF NOT EXISTS price_config (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  price_per_sheet REAL NOT NULL CHECK(price_per_sheet >= 0),
  ink_cost REAL NOT NULL CHECK(ink_cost >= 0),
  lamination_cost REAL NOT NULL CHECK(lamination_cost >= 0),
  deckbox_price REAL NOT NULL CHECK(deckbox_price >= 0),
  sleeves_price REAL NOT NULL CHECK(sleeves_price >= 0),
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default pricing (from environment variables or defaults)
INSERT OR IGNORE INTO price_config (
  id,
  price_per_sheet,
  ink_cost,
  lamination_cost,
  deckbox_price,
  sleeves_price
) VALUES (
  1,
  5.00,   -- R$ 5 per sheet
  2.00,   -- R$ 2 ink cost
  1.50,   -- R$ 1.50 lamination
  15.00,  -- R$ 15 deck box
  10.00   -- R$ 10 sleeves
);

-- ============================================================================
-- TABLE: ticket_history
-- Purpose: Audit trail of ticket status changes
-- ============================================================================

CREATE TABLE IF NOT EXISTS ticket_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL,
  old_status TEXT NULL,
  new_status TEXT NOT NULL,
  old_category_id TEXT NULL,
  new_category_id TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT NULL,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

-- Indexes for ticket_history
CREATE INDEX idx_history_ticket_id ON ticket_history(ticket_id);
CREATE INDEX idx_history_changed_at ON ticket_history(changed_at DESC);

-- ============================================================================
-- TABLE: schema_migrations
-- Purpose: Track applied database migrations
-- ============================================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Mark initial migration as applied
INSERT OR IGNORE INTO schema_migrations (version) VALUES (1);

-- ============================================================================
-- TRIGGERS
-- Purpose: Auto-update timestamps and enforce business rules
-- ============================================================================

-- Trigger: Update tickets.updated_at on any change
CREATE TRIGGER IF NOT EXISTS update_tickets_timestamp
AFTER UPDATE ON tickets
FOR EACH ROW
BEGIN
  UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Trigger: Update orders.updated_at on any change
CREATE TRIGGER IF NOT EXISTS update_orders_timestamp
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
  UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Trigger: Update payments.updated_at on any change
CREATE TRIGGER IF NOT EXISTS update_payments_timestamp
AFTER UPDATE ON payments
FOR EACH ROW
BEGIN
  UPDATE payments SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Trigger: Update price_config.updated_at on any change
CREATE TRIGGER IF NOT EXISTS update_price_config_timestamp
AFTER UPDATE ON price_config
FOR EACH ROW
BEGIN
  UPDATE price_config SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Trigger: Set payment.approved_at when status changes to APPROVED
CREATE TRIGGER IF NOT EXISTS set_payment_approved_at
AFTER UPDATE OF status ON payments
FOR EACH ROW
WHEN NEW.status = 'APPROVED' AND OLD.status != 'APPROVED'
BEGIN
  UPDATE payments SET approved_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger: Set payment.cancelled_at when status changes to CANCELLED
CREATE TRIGGER IF NOT EXISTS set_payment_cancelled_at
AFTER UPDATE OF status ON payments
FOR EACH ROW
WHEN NEW.status IN ('CANCELLED', 'REJECTED', 'REFUNDED') 
  AND OLD.status NOT IN ('CANCELLED', 'REJECTED', 'REFUNDED')
BEGIN
  UPDATE payments SET cancelled_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger: Set ticket.closed_at when status changes to DELIVERED or CANCELLED
CREATE TRIGGER IF NOT EXISTS set_ticket_closed_at
AFTER UPDATE OF status ON tickets
FOR EACH ROW
WHEN NEW.status IN ('DELIVERED', 'CANCELLED') 
  AND OLD.status NOT IN ('DELIVERED', 'CANCELLED')
BEGIN
  UPDATE tickets SET closed_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger: Auto-create ticket history entry on status change
CREATE TRIGGER IF NOT EXISTS create_ticket_history
AFTER UPDATE OF status ON tickets
FOR EACH ROW
WHEN NEW.status != OLD.status
BEGIN
  INSERT INTO ticket_history (
    ticket_id,
    old_status,
    new_status,
    old_category_id,
    new_category_id,
    changed_by,
    notes
  ) VALUES (
    NEW.id,
    OLD.status,
    NEW.status,
    OLD.category_id,
    NEW.category_id,
    'SYSTEM', -- Will be overridden by application with actual user ID
    'Auto-generated history entry'
  );
END;

-- ============================================================================
-- VIEWS (Optional - for convenience queries)
-- ============================================================================

-- View: Active tickets with order details
CREATE VIEW IF NOT EXISTS v_active_tickets AS
SELECT 
  t.id AS ticket_id,
  t.channel_id,
  t.user_id,
  t.status AS ticket_status,
  t.created_at AS ticket_created_at,
  o.id AS order_id,
  o.card_count,
  o.decklist_url,
  o.include_deckbox,
  o.include_sleeves,
  o.total_price,
  p.status AS payment_status,
  p.mercadopago_payment_id,
  p.approved_at
FROM tickets t
LEFT JOIN orders o ON t.id = o.ticket_id
LEFT JOIN payments p ON o.id = p.order_id
WHERE t.status NOT IN ('DELIVERED', 'CANCELLED');

-- View: Admin dashboard summary
CREATE VIEW IF NOT EXISTS v_admin_dashboard AS
SELECT 
  (SELECT COUNT(*) FROM tickets WHERE status = 'NEW') AS new_tickets,
  (SELECT COUNT(*) FROM tickets WHERE status = 'PENDING_PAYMENT') AS pending_payment,
  (SELECT COUNT(*) FROM tickets WHERE status = 'APPROVED') AS approved,
  (SELECT COUNT(*) FROM tickets WHERE status = 'READY') AS ready_for_delivery,
  (SELECT COUNT(*) FROM tickets WHERE status = 'DELIVERED' AND DATE(closed_at) = DATE('now')) AS delivered_today,
  (SELECT COALESCE(SUM(total_price), 0) FROM orders o JOIN tickets t ON o.ticket_id = t.id WHERE t.status = 'APPROVED') AS pending_revenue;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
```

---

## Migration Files

### 001_initial.sql

**Purpose**: Initial database schema creation

**Content**: The SQL above

**Rollback** (if needed):
```sql
-- Rollback 001_initial.sql
PRAGMA foreign_keys = OFF;

DROP TRIGGER IF EXISTS create_ticket_history;
DROP TRIGGER IF EXISTS set_ticket_closed_at;
DROP TRIGGER IF EXISTS set_payment_cancelled_at;
DROP TRIGGER IF EXISTS set_payment_approved_at;
DROP TRIGGER IF EXISTS update_price_config_timestamp;
DROP TRIGGER IF EXISTS update_payments_timestamp;
DROP TRIGGER IF EXISTS update_orders_timestamp;
DROP TRIGGER IF EXISTS update_tickets_timestamp;

DROP VIEW IF EXISTS v_admin_dashboard;
DROP VIEW IF EXISTS v_active_tickets;

DROP TABLE IF EXISTS schema_migrations;
DROP TABLE IF EXISTS ticket_history;
DROP TABLE IF EXISTS price_config;
DROP TABLE IF EXISTS payment_webhooks;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS tickets;

PRAGMA foreign_keys = ON;
```

---

## Query Examples

### 1. Create New Ticket

```sql
INSERT INTO tickets (channel_id, user_id, status, category_id)
VALUES (?, ?, 'NEW', ?);
```

### 2. Get Ticket by Channel ID

```sql
SELECT * FROM tickets WHERE channel_id = ?;
```

### 3. Create Order with Calculated Sheet Count

```typescript
const sheetCount = Math.ceil(cardCount / 9);
```

```sql
INSERT INTO orders (
  ticket_id,
  card_count,
  decklist_url,
  include_deckbox,
  include_sleeves,
  sheet_count,
  total_price
) VALUES (?, ?, ?, ?, ?, ?, ?);
```

### 4. Calculate Order Price

```sql
SELECT 
  price_per_sheet,
  ink_cost,
  lamination_cost,
  deckbox_price,
  sleeves_price
FROM price_config
WHERE id = 1;
```

```typescript
// In application code
const materialCost = (sheetCount * pricePerSheet) + inkCost + laminationCost;
const extrasCost = (includeDeckbox ? deckboxPrice : 0) + (includeSleeves ? sleevesPrice : 0);
const totalPrice = materialCost + extrasCost;
```

### 5. Create Payment

```sql
INSERT INTO payments (
  order_id,
  amount,
  pix_key,
  qr_code_url,
  mercadopago_payment_id,
  mercadopago_preference_id,
  status
) VALUES (?, ?, ?, ?, ?, ?, 'PENDING');
```

### 6. Update Payment Status (from webhook)

```sql
UPDATE payments
SET status = ?, mercadopago_payment_id = ?
WHERE order_id = (
  SELECT id FROM orders WHERE ticket_id = (
    SELECT id FROM tickets WHERE channel_id = ?
  )
);
```

### 7. Get All Approved Orders

```sql
SELECT 
  t.id AS ticket_id,
  t.channel_id,
  t.user_id,
  o.card_count,
  o.include_deckbox,
  o.include_sleeves,
  o.total_price,
  o.decklist_url,
  p.approved_at
FROM tickets t
JOIN orders o ON t.id = o.ticket_id
JOIN payments p ON o.id = p.order_id
WHERE t.status = 'APPROVED'
ORDER BY p.approved_at ASC;
```

### 8. Mark Order as Ready

```sql
-- Transaction required
BEGIN TRANSACTION;

UPDATE tickets SET status = 'READY', category_id = ? WHERE id = ?;

INSERT INTO ticket_history (
  ticket_id,
  old_status,
  new_status,
  old_category_id,
  new_category_id,
  changed_by,
  notes
) VALUES (?, 'APPROVED', 'READY', ?, ?, ?, 'Marked as ready for delivery');

COMMIT;
```

### 9. Get User's Active Tickets

```sql
SELECT * FROM tickets
WHERE user_id = ? AND status NOT IN ('DELIVERED', 'CANCELLED')
ORDER BY created_at DESC;
```

### 10. Log Payment Webhook

```sql
INSERT INTO payment_webhooks (
  payment_id,
  mercadopago_event_type,
  mercadopago_action,
  payload,
  processed,
  error_message
) VALUES (?, ?, ?, ?, ?, ?);
```

### 11. Get Dashboard Statistics

```sql
SELECT * FROM v_admin_dashboard;
```

---

## Transaction Patterns

### Pattern 1: Create Ticket → Order → Payment (Atomic)

```typescript
db.transaction(() => {
  // 1. Create ticket
  const ticketResult = db.prepare(`
    INSERT INTO tickets (channel_id, user_id, status, category_id)
    VALUES (?, ?, 'PENDING_PAYMENT', ?)
  `).run(channelId, userId, categoryId);
  
  const ticketId = ticketResult.lastInsertRowid;
  
  // 2. Create order
  const orderResult = db.prepare(`
    INSERT INTO orders (
      ticket_id, card_count, decklist_url,
      include_deckbox, include_sleeves, sheet_count, total_price
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(ticketId, cardCount, decklistUrl, deckbox, sleeves, sheetCount, totalPrice);
  
  const orderId = orderResult.lastInsertRowid;
  
  // 3. Create payment
  db.prepare(`
    INSERT INTO payments (order_id, amount, pix_key, qr_code_url, status)
    VALUES (?, ?, ?, ?, 'PENDING')
  `).run(orderId, totalPrice, pixKey, qrCodeUrl);
})();
```

### Pattern 2: Process Webhook (Atomic)

```typescript
db.transaction(() => {
  // 1. Log webhook
  const webhookResult = db.prepare(`
    INSERT INTO payment_webhooks (
      payment_id, mercadopago_event_type,
      mercadopago_action, payload
    ) VALUES (?, ?, ?, ?)
  `).run(paymentId, eventType, action, JSON.stringify(payload));
  
  // 2. Update payment status
  db.prepare(`
    UPDATE payments SET status = 'APPROVED' WHERE id = ?
  `).run(paymentId);
  
  // 3. Update ticket status
  const payment = db.prepare(`SELECT order_id FROM payments WHERE id = ?`).get(paymentId);
  const order = db.prepare(`SELECT ticket_id FROM orders WHERE id = ?`).get(payment.order_id);
  
  db.prepare(`
    UPDATE tickets SET status = 'APPROVED' WHERE id = ?
  `).run(order.ticket_id);
  
  // 4. Mark webhook as processed
  db.prepare(`
    UPDATE payment_webhooks SET processed = 1 WHERE id = ?
  `).run(webhookResult.lastInsertRowid);
})();
```

---

## Constraints & Validations

### Data Type Constraints

- All Discord IDs stored as TEXT (prevent JavaScript number precision loss)
- All timestamps use SQLite DATETIME (ISO 8601 format)
- All monetary values use REAL (2 decimal places)
- Boolean values stored as INTEGER (0 = false, 1 = true)

### Business Rule Constraints

1. **Ticket Status Transitions**: Enforced in application code (see data-model.md state machine)
2. **Payment Amount**: Must match order.total_price
3. **Singleton PriceConfig**: Only one row (id = 1)
4. **Sheet Count**: Always calculated as CEIL(card_count / 9)

### Foreign Key Constraints

- `orders.ticket_id` → `tickets.id` (CASCADE on delete)
- `payments.order_id` → `orders.id` (CASCADE on delete)
- `payment_webhooks.payment_id` → `payments.id` (CASCADE on delete)
- `ticket_history.ticket_id` → `tickets.id` (CASCADE on delete)

---

## Backup & Recovery

### Backup Strategy

```bash
# Daily backup
sqlite3 database/proxytickets.db ".backup 'backups/proxytickets_$(date +%Y%m%d).db'"

# Compress old backups
gzip backups/proxytickets_*.db
```

### Recovery

```bash
# Restore from backup
cp backups/proxytickets_20260224.db database/proxytickets.db

# Or use SQLite backup command
sqlite3 database/proxytickets.db ".restore 'backups/proxytickets_20260224.db'"
```

### Integrity Check

```sql
PRAGMA integrity_check;
PRAGMA foreign_key_check;
```

---

## Performance Considerations

1. **Indexes**: All foreign keys and frequently queried columns indexed
2. **Transactions**: Use transactions for multi-step operations
3. **Write Lock**: SQLite allows one writer - webhook queue may be needed for high volume
4. **WAL Mode**: Consider enabling for better concurrency

```sql
-- Enable WAL mode for better read/write concurrency
PRAGMA journal_mode=WAL;
```

5. **Vacuum**: Periodic VACUUM to reclaim space and optimize

```sql
-- Run periodically (e.g., weekly during low traffic)
VACUUM;
```

---

## Contract Tests

Database contracts should be tested with:

1. **Schema Tests**: Verify all tables, columns, constraints exist
2. **Trigger Tests**: Verify auto-update timestamps work
3. **Foreign Key Tests**: Verify CASCADE behavior
4. **Check Constraint Tests**: Verify enum values enforced
5. **Transaction Tests**: Verify atomicity of multi-step operations

See `tests/contract/database.test.ts` for implementation.
