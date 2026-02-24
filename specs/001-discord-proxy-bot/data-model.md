# Data Model: Discord Proxy Bot

**Date**: 2026-02-24  
**Version**: 1.0  
**Database**: SQLite 3

## Overview

Este documento define o modelo de dados completo para o sistema de gerenciamento de pedidos de cartas proxy. O modelo suporta o ciclo de vida completo: criação de ticket → coleta de informações → pagamento → produção → entrega → arquivamento.

## Entity Relationship Diagram

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Ticket    │ 1─────1 │    Order    │ 1─────1 │   Payment   │
└─────────────┘         └─────────────┘         └─────────────┘
      │                                                 │
      │ n                                               │ n
      │                                                 │
      ▼                                                 ▼
┌──────────────┐                              ┌─────────────────┐
│TicketHistory │                              │ PaymentWebhook  │
└──────────────┘                              └─────────────────┘

┌─────────────┐
│ PriceConfig │ (singleton - one row)
└─────────────┘
```

## Entities

### 1. Ticket

Representa um canal de ticket no Discord e seu ciclo de vida.

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Internal ticket ID |
| `channel_id` | TEXT | UNIQUE, NOT NULL | Discord channel ID (snowflake) |
| `user_id` | TEXT | NOT NULL | Discord user ID who created ticket |
| `status` | TEXT | NOT NULL, CHECK | Current status (see State Machine below) |
| `category_id` | TEXT | NOT NULL | Current Discord category ID |
| `created_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Ticket creation timestamp |
| `updated_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Last update timestamp |
| `closed_at` | DATETIME | NULL | Timestamp when ticket was closed/archived |

**Status Values** (enum):
- `NEW` - Ticket criado, aguardando formulário
- `COLLECTING` - Formulário em andamento
- `PENDING_PAYMENT` - Aguardando pagamento
- `PAYMENT_PROCESSING` - Pagamento em processamento
- `APPROVED` - Pagamento aprovado, aguardando produção
- `READY` - Pronto para entrega
- `DELIVERED` - Entregue ao cliente
- `CANCELLED` - Cancelado

**Validation Rules**:
- `channel_id` deve ser numérico (Discord snowflake válido)
- `user_id` deve ser numérico (Discord snowflake válido)
- `status` deve ser um dos valores enum acima
- `closed_at` só pode ser NOT NULL quando status é DELIVERED ou CANCELLED

**Relationships**:
- 1:1 com Order (um ticket tem um pedido)
- 1:n com TicketHistory (histórico de mudanças)

---

### 2. Order

Representa os detalhes do pedido de cartas proxy.

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Internal order ID |
| `ticket_id` | INTEGER | UNIQUE, NOT NULL, FOREIGN KEY(ticket.id) | Associated ticket |
| `card_count` | INTEGER | NOT NULL, CHECK(card_count > 0) | Number of cards in deck |
| `decklist_url` | TEXT | NOT NULL | URL to decklist |
| `include_deckbox` | BOOLEAN | NOT NULL, DEFAULT 0 | Whether to include deck box |
| `include_sleeves` | BOOLEAN | NOT NULL, DEFAULT 0 | Whether to include sleeves |
| `sheet_count` | INTEGER | NOT NULL, GENERATED | Calculated: CEIL(card_count / 9) |
| `total_price` | REAL | NOT NULL | Total calculated price |
| `created_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Order creation timestamp |
| `updated_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Validation Rules**:
- `card_count` deve ser > 0 (minimo 1 carta)
- `card_count` deve ser <= 1000 (limite razoável)
- `decklist_url` deve começar com http:// ou https://
- `sheet_count` é calculado como CEIL(card_count / 9.0)
- `total_price` deve ser >= 0

**Calculation Formula**:
```typescript
// Pricing calculation (derived from PriceConfig)
sheet_count = Math.ceil(card_count / 9);
material_cost = (sheet_count * price_per_sheet) + ink_cost + lamination_cost;
extras_cost = (include_deckbox ? deckbox_price : 0) + (include_sleeves ? sleeves_price : 0);
total_price = material_cost + extras_cost;
```

**Relationships**:
- 1:1 com Ticket
- 1:1 com Payment

---

### 3. Payment

Registra informações de pagamento via Mercado Pago.

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Internal payment ID |
| `order_id` | INTEGER | UNIQUE, NOT NULL, FOREIGN KEY(order.id) | Associated order |
| `amount` | REAL | NOT NULL | Payment amount (matches order.total_price) |
| `pix_key` | TEXT | NOT NULL | Generated Pix key |
| `qr_code_url` | TEXT | NOT NULL | Mercado Pago QR code image URL |
| `mercadopago_payment_id` | TEXT | UNIQUE, NULL | MP payment ID (populated when payment created) |
| `mercadopago_preference_id` | TEXT | UNIQUE, NULL | MP preference ID |
| `status` | TEXT | NOT NULL, CHECK | Payment status (see values below) |
| `created_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Payment creation timestamp |
| `approved_at` | DATETIME | NULL | Timestamp when payment approved |
| `cancelled_at` | DATETIME | NULL | Timestamp if payment cancelled |
| `updated_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Status Values** (enum):
- `PENDING` - Aguardando pagamento
- `PROCESSING` - Pagamento em processamento (Mercado Pago)
- `APPROVED` - Pagamento aprovado
- `REJECTED` - Pagamento rejeitado
- `CANCELLED` - Pagamento cancelado
- `REFUNDED` - Pagamento reembolsado

**Validation Rules**:
- `amount` deve ser > 0
- `amount` deve igualar `order.total_price` quando criado
- `pix_key` deve estar no formato válido Pix
- `approved_at` só pode ser NOT NULL quando status é APPROVED
- `cancelled_at` só pode ser NOT NULL quando status é CANCELLED ou REFUNDED

**Relationships**:
- 1:1 com Order
- 1:n com PaymentWebhook (histórico de webhooks recebidos)

---

### 4. PaymentWebhook

Registra todos os webhooks recebidos do Mercado Pago para auditoria.

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Internal webhook record ID |
| `payment_id` | INTEGER | NOT NULL, FOREIGN KEY(payment.id) | Associated payment |
| `mercadopago_event_type` | TEXT | NOT NULL | MP event type (e.g., 'payment') |
| `mercadopago_action` | TEXT | NOT NULL | MP action (e.g., 'payment.created', 'payment.updated') |
| `payload` | TEXT | NOT NULL | Full JSON payload from webhook |
| `received_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | When webhook received |
| `processed` | BOOLEAN | NOT NULL, DEFAULT 0 | Whether webhook was processed |
| `error_message` | TEXT | NULL | Error message if processing failed |

**Validation Rules**:
- `payload` deve ser JSON válido
- `processed` é marcado como 1 após processamento bem-sucedido

**Relationships**:
- n:1 com Payment

---

### 5. PriceConfig

Configuração de preços (singleton - uma única linha na tabela).

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, CHECK(id = 1) | Always 1 (singleton) |
| `price_per_sheet` | REAL | NOT NULL, CHECK(price_per_sheet >= 0) | Preço por folha fotográfica |
| `ink_cost` | REAL | NOT NULL, CHECK(ink_cost >= 0) | Custo de tinta por impressão |
| `lamination_cost` | REAL | NOT NULL, CHECK(lamination_cost >= 0) | Custo de plastificação |
| `deckbox_price` | REAL | NOT NULL, CHECK(deckbox_price >= 0) | Preço de deck box |
| `sleeves_price` | REAL | NOT NULL, CHECK(sleeves_price >= 0) | Preço de sleeves |
| `updated_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Last config update |

**Validation Rules**:
- Apenas uma linha deve existir na tabela (id sempre = 1)
- Todos os preços devem ser >= 0
- UPDATE apenas, INSERT apenas na initialização

**Default Values** (from .env):
```sql
INSERT INTO price_config (id, price_per_sheet, ink_cost, lamination_cost, deckbox_price, sleeves_price)
VALUES (1, 5.00, 2.00, 1.50, 15.00, 10.00);
```

**Relationships**:
- None (singleton configuration table)

---

### 6. TicketHistory

Histórico de mudanças de status dos tickets (opcional, para auditoria).

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | History record ID |
| `ticket_id` | INTEGER | NOT NULL, FOREIGN KEY(ticket.id) | Associated ticket |
| `old_status` | TEXT | NULL | Previous status (NULL on first entry) |
| `new_status` | TEXT | NOT NULL | New status |
| `old_category_id` | TEXT | NULL | Previous Discord category |
| `new_category_id` | TEXT | NOT NULL | New Discord category |
| `changed_by` | TEXT | NOT NULL | Discord user ID who made change |
| `changed_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Timestamp of change |
| `notes` | TEXT | NULL | Optional notes about the change |

**Validation Rules**:
- `new_status` deve ser válido conforme Ticket.status enum
- `changed_by` deve ser Discord user ID válido

**Relationships**:
- n:1 com Ticket

---

## State Machines

### Ticket Status State Machine

```
[NEW] 
  ↓ (user starts form)
[COLLECTING]
  ↓ (form completed)
[PENDING_PAYMENT]
  ↓ (payment created in Mercado Pago)
[PAYMENT_PROCESSING]
  ↓ (webhook: payment approved)
[APPROVED]
  ↓ (admin marks as ready)
[READY]
  ↓ (admin marks as delivered)
[DELIVERED]

** At any point before APPROVED **
  → [CANCELLED] (admin cancels or timeout)
```

**Valid Transitions**:
- NEW → COLLECTING, CANCELLED
- COLLECTING → PENDING_PAYMENT, CANCELLED
- PENDING_PAYMENT → PAYMENT_PROCESSING, CANCELLED
- PAYMENT_PROCESSING → APPROVED, CANCELLED
- APPROVED → READY, CANCELLED
- READY → DELIVERED
- DELIVERED → (terminal state)
- CANCELLED → (terminal state)

### Payment Status State Machine

```
[PENDING]
  ↓ (Mercado Pago processing)
[PROCESSING]
  ↓ (webhook: approved)
[APPROVED]

** Alternative paths **
[PENDING/PROCESSING] → [REJECTED] (payment failed)
[PENDING/PROCESSING] → [CANCELLED] (user cancelled)
[APPROVED] → [REFUNDED] (admin refunded)
```

**Valid Transitions**:
- PENDING → PROCESSING, REJECTED, CANCELLED
- PROCESSING → APPROVED, REJECTED, CANCELLED
- APPROVED → REFUNDED
- REJECTED → (terminal state)
- CANCELLED → (terminal state)
- REFUNDED → (terminal state)

---

## Database Schema (SQL)

See [contracts/database.md](contracts/database.md) for complete SQL schema with indexes and triggers.

**Key Indexes Required**:
- `ticket.channel_id` (UNIQUE) - fast lookup by Discord channel
- `ticket.user_id` - lookup all tickets for a user
- `ticket.status` - filter tickets by status
- `payment.mercadopago_payment_id` (UNIQUE) - webhook payload matching
- `payment.status` - admin panel filtering
- `order.ticket_id` (UNIQUE) - one order per ticket

**Triggers Required**:
- `update_ticket_timestamp` - auto-update `ticket.updated_at` on changes
- `update_order_timestamp` - auto-update `order.updated_at` on changes
- `update_payment_timestamp` - auto-update `payment.updated_at` on changes
- `validate_payment_amount` - ensure `payment.amount` matches `order.total_price`

---

## Data Integrity Rules

1. **Referential Integrity**:
   - ON DELETE CASCADE: deleting ticket deletes associated order, payment, history
   - ON UPDATE CASCADE: updating IDs propagates to related tables

2. **Validation Constraints**:
   - All datetime fields use UTC timezone
   - All monetary values use REAL type (2 decimal precision)
   - Discord IDs stored as TEXT (JavaScript number precision limitations)

3. **Transaction Boundaries**:
   - Creating order + payment must be atomic transaction
   - Updating ticket status + creating history entry must be atomic
   - Processing webhook + updating payment status must be atomic

4. **Concurrency**:
   - SQLite write lock: only one write transaction at a time
   - Read operations can happen concurrently
   - Webhook processing must use BEGIN IMMEDIATE to acquire write lock

---

## Migration Strategy

**Initial Schema** (v1):
- Create all tables with constraints
- Insert default PriceConfig row
- Create indexes
- Create triggers

**Future Migrations**:
- Version-numbered files: `001_initial.sql`, `002_add_field.sql`, etc.
- Migration tracking in `schema_migrations` table
- Always include rollback SQL in comments

**Migration Tracking Table**:
```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## Example Data

**Ticket Example**:
```json
{
  "id": 1,
  "channel_id": "1234567890123456789",
  "user_id": "9876543210987654321",
  "status": "APPROVED",
  "category_id": "5555555555555555555",
  "created_at": "2026-02-24T10:00:00Z",
  "updated_at": "2026-02-24T10:15:00Z",
  "closed_at": null
}
```

**Order Example**:
```json
{
  "id": 1,
  "ticket_id": 1,
  "card_count": 100,
  "decklist_url": "https://ligamagic.com.br/?view=deck/list&id=12345",
  "include_deckbox": true,
  "include_sleeves": true,
  "sheet_count": 12,
  "total_price": 104.50,
  "created_at": "2026-02-24T10:05:00Z",
  "updated_at": "2026-02-24T10:05:00Z"
}
```

**Payment Example**:
```json
{
  "id": 1,
  "order_id": 1,
  "amount": 104.50,
  "pix_key": "00020126580014br.gov.bcb.pix...",
  "qr_code_url": "https://api.mercadopago.com/qr/12345.png",
  "mercadopago_payment_id": "12345678",
  "mercadopago_preference_id": "87654321",
  "status": "APPROVED",
  "created_at": "2026-02-24T10:10:00Z",
  "approved_at": "2026-02-24T10:12:00Z",
  "cancelled_at": null,
  "updated_at": "2026-02-24T10:12:00Z"
}
```

---

## Notes

- All timestamps use UTC timezone
- Discord snowflake IDs are stored as TEXT to avoid JavaScript number precision issues
- PriceConfig is singleton to simplify pricing logic (no historical pricing)
- TicketHistory is optional but recommended for audit trail
- PaymentWebhook stores raw JSON for debugging and compliance
