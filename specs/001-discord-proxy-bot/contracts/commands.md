# Command Contracts: Discord Proxy Bot

**Version**: 1.0  
**Date**: 2026-02-24  
**Purpose**: Define all Discord command interfaces, interactions, and message formats

## Overview

Este documento define os contratos de interface para todos os comandos Discord, interactions (buttons, select menus), e formatos de mensagens do bot. Estes contratos servem como especificação para implementação e base para contract tests.

---

## Slash Commands

### 1. `/setup`

**Description**: Setup inicial do bot no servidor (admin only)

**Permission**: Administrator only (`ADMIN_USER_ID` from config)

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `ticket_channel` | Channel | Yes | Canal onde o botão de criação de tickets será postado |
| `new_category` | Category | Yes | Categoria "=== TICKETS NOVOS ===" |
| `pending_category` | Category | Yes | Categoria "=== PENDENTES ===" |
| `approved_category` | Category | Yes | Categoria "=== APROVADO ===" |
| `admin_channel` | Channel | Yes | Canal privado para painel administrativo |

**Response**:
```
✅ Setup concluído!
📝 Mensagem de criação de tickets postada em #{ticket_channel}
📂 Categorias configuradas
🔧 Painel admin disponível em #{admin_channel}
```

**Side Effects**:
- Post message with "Criar Ticket" button in `ticket_channel`
- Store configuration in database or bot memory
- Send welcome message to `admin_channel`

**Errors**:
- `PERMISSION_DENIED` - User is not admin
- `INVALID_CHANNEL` - Channel doesn't exist or bot lacks permissions
- `ALREADY_CONFIGURED` - Bot already set up (use `/reconfigure`)

---

### 2. `/config-pricing`

**Description**: Configurar valores de materiais e extras (admin only)

**Permission**: Administrator only

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `sheet_price` | Number | No | Preço por folha fotográfica (default: current value) |
| `ink_cost` | Number | No | Custo de tinta (default: current value) |
| `lamination_cost` | Number | No | Custo de plastificação (default: current value) |
| `deckbox_price` | Number | No | Preço de deck box (default: current value) |
| `sleeves_price` | Number | No | Preço de sleeves (default: current value) |

**Response**:
```
💰 Configuração de preços atualizada:
📄 Folha: R$ {sheet_price}
🖨️ Tinta: R$ {ink_cost}
📦 Plastificação: R$ {lamination_cost}
📦 Deck Box: R$ {deckbox_price}
🛡️ Sleeves: R$ {sleeves_price}

Exemplo: 100 cartas + deck box + sleeves = R$ {calculated_example}
```

**Side Effects**:
- Update `price_config` table
- Affect all future order calculations

**Errors**:
- `PERMISSION_DENIED` - User is not admin
- `INVALID_PRICE` - Negative value provided

---

### 3. `/list-orders`

**Description**: Listar pedidos filtrados por status (admin only)

**Permission**: Administrator only

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `status` | String (enum) | No | Filter by status (default: all) |

**Status Options**:
- `approved` - Pedidos aprovados aguardando produção
- `ready` - Pedidos prontos para entrega
- `delivered` - Pedidos já entregues (últimos 30 dias)
- `all` - Todos os pedidos

**Response** (Embed):
```
📋 Pedidos: {status}
━━━━━━━━━━━━━━━━━━━━━━━

🎫 Ticket #001
👤 Cliente: @username
📦 100 cartas + deck box + sleeves
💰 R$ 104,50
🔗 [Decklist](url)
📅 Criado: 24/02/2026 10:00
🏷️ Status: Aprovado

[Botões: Marcar Pronto | Ver Detalhes]

🎫 Ticket #002
...

Mostrando {count} pedidos
```

**Side Effects**: None (read-only)

**Errors**:
- `PERMISSION_DENIED` - User is not admin

---

### 4. `/close-ticket`

**Description**: Fechar manualmente um ticket (admin only ou ticket owner)

**Permission**: Admin OR ticket channel creator

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `reason` | String | No | Razão para fechamento |

**Response**:
```
🔒 Ticket fechado
Motivo: {reason}
Canal será arquivado em 10 segundos...
```

**Side Effects**:
- Update ticket status to CANCELLED
- Archive or delete channel after 10 seconds
- Log in TicketHistory

**Errors**:
- `NOT_IN_TICKET` - Command not used in a ticket channel
- `PERMISSION_DENIED` - User is not admin nor ticket owner
- `ALREADY_CLOSED` - Ticket already closed

---

## Button Interactions

### 1. `create-ticket` Button

**Label**: "🎫 Criar Ticket"  
**Style**: PRIMARY (blue)  
**Custom ID**: `create_ticket_{timestamp}`

**Trigger**: User clicks button in designated ticket channel

**Behavior**:
1. Check if user already has open ticket
   - If yes: Reply ephemeral "Você já tem um ticket aberto em #{channel}"
   - If no: Proceed to step 2
2. Create private channel in "=== TICKETS NOVOS ===" category
   - Name format: `ticket-{username}-{number}`
   - Permissions: User + Bot + Admin only
3. Send welcome message in new channel
4. Reply ephemeral: "✅ Ticket criado! Veja #{new-channel}"

**Response Message** (in new ticket channel):
```
Embed:
━━━━━━━━━━━━━━━━━━━━━━━
🎫 Bem-vindo ao seu ticket!
━━━━━━━━━━━━━━━━━━━━━━━

Vamos configurar seu pedido de cartas proxy!

Clique no botão abaixo para começar 👇
━━━━━━━━━━━━━━━━━━━━━━━

[Button: "📝 Iniciar Pedido"]
```

**Errors**:
- `RATE_LIMITED` - User created too many tickets recently (1 every 5 minutes)
- `BOT_PERMISSION_ERROR` - Bot lacks permission to create channels

---

### 2. `start-order` Button

**Label**: "📝 Iniciar Pedido"  
**Style**: SUCCESS (green)  
**Custom ID**: `start_order_{ticket_id}`

**Trigger**: User clicks button in ticket welcome message

**Behavior**:
1. Send extras select menu
2. Disable this button (can only start once)

**Response**: (See Select Menu: `select-extras`)

---

### 3. `mark-ready` Button

**Label**: "✅ Marcar Pronto"  
**Style**: SUCCESS (green)  
**Custom ID**: `mark_ready_{order_id}`

**Permission**: Admin only

**Trigger**: Admin clicks in `/list-orders` embed

**Behavior**:
1. Update order status: APPROVED → READY
2. Move ticket channel to appropriate category
3. Send message to ticket channel: "🎉 Seu pedido está pronto! Entre em contato para combinar a entrega."
4. Update embed button to "Marcar Entregue"

**Response** (ephemeral):
```
✅ Pedido #{order_id} marcado como pronto!
📢 Cliente foi notificado no ticket.
```

---

### 4. `mark-delivered` Button

**Label**: "📦 Marcar Entregue"  
**Style**: SUCCESS (green)  
**Custom ID**: `mark_delivered_{order_id}`

**Permission**: Admin only

**Trigger**: Admin clicks after marking ready

**Behavior**:
1. Update order status: READY → DELIVERED
2. Update ticket status: READY → DELIVERED
3. Send final message to ticket channel
4. Archive ticket channel after 1 hour
5. Log to TicketHistory

**Response** (ephemeral):
```
📦 Pedido #{order_id} marcado como entregue!
🗃️ Ticket será arquivado em 1 hora.
```

---

## Select Menu Interactions

### 1. `select-extras` Select Menu

**Placeholder**: "Selecione os extras desejados (opcional)"  
**Custom ID**: `select_extras_{ticket_id}`  
**Min Values**: 0 (none required)  
**Max Values**: 2 (both extras)

**Options**:
```json
[
  {
    "label": "Deck Box",
    "description": "Caixa para armazenar o deck",
    "value": "deckbox",
    "emoji": "📦"
  },
  {
    "label": "Sleeves",
    "description": "Protetor de cartas (100 unidades)",
    "value": "sleeves",
    "emoji": "🛡️"
  }
]
```

**Response**:
```
✅ Extras selecionados: {selected_list ou "Nenhum"}

Quantas cartas há no seu deck?
(Padrão para Commander: 100)

Digite o número abaixo:
```

**Next Step**: Wait for user message with number (see Message Collector: card-count)

---

## Message Collectors

### 1. `card-count` Collector

**Trigger**: After extras selection

**Expected Input**: Integer number (1-1000)

**Validation**:
- Must be valid integer
- Must be > 0
- Must be <= 1000 (reasonable limit)

**On Valid Input**:
```
✅ Quantidade: {count} cartas
📄 Folhas necessárias: {ceil(count/9)}

Agora me envie o LINK da sua decklist:
(Aceito LigaMagic, Moxfield, Archidekt, etc.)
```

**On Invalid Input**:
```
❌ Quantidade inválida!
Por favor, envie um número entre 1 e 1000.
```

**Next Step**: Message Collector: decklist-url

---

### 2. `decklist-url` Collector

**Trigger**: After card count validation

**Expected Input**: Valid URL (HTTP/HTTPS)

**Validation**:
- Must be valid URL format
- Must start with http:// or https://

**On Valid Input**:
1. Calculate price based on:
   - `card_count`
   - `extras_selected`
   - Current `PriceConfig` values
2. Create `Order` in database
3. Create `Payment` in Mercado Pago
4. Send payment message (see Payment Message Format)
5. Move channel to "=== PENDENTES ===" category

**On Invalid Input**:
```
❌ URL inválida!
Por favor, envie um link válido começando com http:// ou https://

Exemplo: https://ligamagic.com.br/?view=deck/list&id=12345
```

---

## Message Formats

### Payment Message

**Format** (Embed):
```
Embed:
━━━━━━━━━━━━━━━━━━━━━━━
💰 Resumo do Pedido
━━━━━━━━━━━━━━━━━━━━━━━

📦 Itens:
• {card_count} cartas ({sheet_count} folhas)
{if deckbox: • Deck Box}
{if sleeves: • Sleeves}

💵 Valores:
Material: R$ {material_cost}
{if extras: Extras: R$ {extras_cost}}
━━━━━━━━━━━━━━━━━━━━━━━
TOTAL: R$ {total_price}

━━━━━━━━━━━━━━━━━━━━━━━
💳 Pagamento via Pix
━━━━━━━━━━━━━━━━━━━━━━━

Chave Pix (Copia e Cola):
```
{pix_key}
```

[Imagem do QR Code]

Status: 🔄 Processando...

━━━━━━━━━━━━━━━━━━━━━━━
Aguardando confirmação de pagamento...
```

**Update After Payment Approved**:
Replace "Status: 🔄 Processando..." with:
```
Status: ✅ APROVADO

Pagamento confirmado em {timestamp}!
Seu pedido entrou na fila de produção.
Você será notificado quando estiver pronto.
```

---

### Admin Notification (DM)

**Trigger**: Payment approved

**Format**:
```
🔔 Novo pedido aprovado!

🎫 Ticket: #{ticket_number}
👤 Cliente: @{username} ({user_id})
📦 {card_count} cartas + {extras}
💰 R$ {total_price}
🔗 Decklist: {url}
📅 Pago em: {timestamp}

[Button: Ver Ticket]
```

---

## Webhook Endpoints

### POST `/webhooks/mercadopago`

**Purpose**: Receive payment status updates from Mercado Pago

**Request Headers**:
```
Content-Type: application/json
x-signature: {mercadopago_signature}
x-request-id: {unique_id}
```

**Request Body** (example):
```json
{
  "action": "payment.updated",
  "api_version": "v1",
  "data": {
    "id": "12345678"
  },
  "date_created": "2026-02-24T10:12:00Z",
  "id": 123456789,
  "live_mode": true,
  "type": "payment",
  "user_id": "987654321"
}
```

**Response**:
- `200 OK` - Webhook processed successfully
- `400 Bad Request` - Invalid signature or payload
- `404 Not Found` - Payment not found in database
- `500 Internal Server Error` - Processing error

**Behavior**:
1. Validate signature (Mercado Pago security)
2. Log webhook to `payment_webhooks` table
3. Fetch payment details from Mercado Pago API using `data.id`
4. Update `Payment` status if changed
5. If status is APPROVED:
   - Update `Ticket` status to APPROVED
   - Move Discord channel to "=== APROVADO ===" category
   - Update payment message in ticket channel
   - Send DM notification to admin
6. Return 200 OK

---

## Error Handling

All commands and interactions must handle these error cases:

**Common Errors**:
1. `PERMISSION_DENIED` - User lacks required permissions
2. `DATABASE_ERROR` - SQLite operation failed
3. `DISCORD_API_ERROR` - Discord API call failed
4. `MERCADOPAGO_ERROR` - Mercado Pago API call failed
5. `VALIDATION_ERROR` - User input validation failed

**Error Response Format**:
```
Embed (Red color):
━━━━━━━━━━━━━━━━━━━━━━━
❌ Erro
━━━━━━━━━━━━━━━━━━━━━━━

{error_message}

{if recoverable: Instruções de recuperação}

━━━━━━━━━━━━━━━━━━━━━━━
```

**Logging**:
All errors must be logged with:
- Timestamp
- User ID
- Command/interaction ID
- Error type and message
- Stack trace (for internal errors)

---

## Rate Limiting

**Ticket Creation**:
- Max 1 ticket per user every 5 minutes
- Max 10 tickets per user per day

**Command Usage**:
- Admin commands: No limit
- User commands: 10 per minute per user

**Webhook Processing**:
- Process webhooks sequentially (SQLite constraint)
- Queue webhooks if processing takes >1s

---

## Testing Contracts

All contracts in this document should have corresponding contract tests:

1. **Command Tests**: Verify command registration and parameter validation
2. **Interaction Tests**: Verify button/select menu custom IDs and responses
3. **Message Format Tests**: Verify embed structure and content
4. **Webhook Tests**: Verify payload parsing and signature validation
5. **Error Tests**: Verify error responses for all error cases

See `tests/contract/` for implementation.
