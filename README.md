# Proxy Tickets Bot

Bot de tickets para pedidos de proxies de Magic: The Gathering, baseado no Constatic (`@constatic/base`).

## Requisitos

- Node.js 20.12+ (obrigatorio)
- MongoDB (usado pelo Prisma)
- Discord app/bot configurado

## Configuracao

Crie um arquivo `.env` na raiz com as variaveis:

```
BOT_TOKEN=
DATABASE_URL=
WEBHOOK_LOGS_URL=
GUILD_ID=
MP_ACCESS_TOKEN=
MP_SANDBOX=true
MP_TEST_PAYER_EMAIL=test@testuser.com
API_TOKEN=
API_HOST=0.0.0.0
API_PORT=3000
```

- `BOT_TOKEN`, `DATABASE_URL`, `MP_ACCESS_TOKEN` e `API_TOKEN` sao obrigatorias.
- `WEBHOOK_LOGS_URL`, `GUILD_ID`, `MP_SANDBOX`, `MP_TEST_PAYER_EMAIL`, `API_HOST` e `API_PORT` sao opcionais.

### Detalhes do .env

- `BOT_TOKEN`: token do bot do Discord.
- `DATABASE_URL`: string de conexao do MongoDB usada pelo Prisma.
- `NODE_OPTIONS`: opcoes adicionais do Node.js (ex: `--max-old-space-size=4096`).
- `WEBHOOK_LOGS_URL`: webhook para logs do bot.
- `GUILD_ID`: ID do servidor para registrar comandos em escopo de guild.
- `MP_ACCESS_TOKEN`: Access Token do Mercado Pago.
- `MP_SANDBOX`: quando `true`, envia `X-Test-Token` nas chamadas do Mercado Pago. Use `false` somente em producao.
- `MP_TEST_PAYER_EMAIL`: email usado como pagador em sandbox pela Orders API. Padrao: `test@testuser.com`.
- `API_TOKEN`: token secreto usado nas rotas protegidas da API HTTP de pedidos.
- `API_HOST`: host de escuta da API HTTP. Padrao: `0.0.0.0`.
- `API_PORT`: porta de escuta da API HTTP. Padrao: `3000`.

## Fluxo principal

- `/config` define categorias e precos.
- `/ticket` publica o painel de criacao de tickets.
- Usuario cria ticket, informa detalhes e aguarda atendimento.
- Admin assume e confirma o pedido, movendo para pendentes.

## Comandos principais

- `/config` (admin)
- `/ticket` (admin)
- `/fechar` (admin, fecha e cancela o ticket do canal atual)

## Scripts

- `npm run dev`: inicia o bot com `.env`
- `npm run dev:dev`: inicia com `.env.dev`
- `npm run watch`: modo watch com `.env`
- `npm run watch:dev`: modo watch com `.env.dev`
- `npm run check`: typecheck
- `npm run build`: build com tsup
- `npm start`: executa o build

## API HTTP de Pedidos

O bot expoe uma API read-only usando Fastify para consulta de pedidos (`TicketOrder`).

### Variaveis de ambiente da API

- `API_TOKEN` (obrigatorio): token secreto usado no header `Authorization: Bearer <token>`.
- `API_HOST` (opcional): host de escuta. Padrao: `0.0.0.0`.
- `API_PORT` (opcional): porta de escuta. Padrao: `3000`.

### Endpoints

| Metodo | Rota | Autenticacao | Descricao |
|--------|------|--------------|-----------|
| GET | `/health` | Publica | Healthcheck da API |
| GET | `/orders/in-progress` | Bearer Token | Pedidos ativos (exceto CONCLUDED e CANCELLED) |
| GET | `/orders/cancelled` | Bearer Token | Pedidos com status CANCELLED |
| GET | `/orders/concluded` | Bearer Token | Pedidos com status CONCLUDED |
| GET | `/orders?status=...` | Bearer Token | Lista todos ou filtra por status |

### Exemplos de requisicao

```bash
# Healthcheck (publico)
curl http://localhost:3000/health

# Listar pedidos em andamento
curl -H "Authorization: Bearer $API_TOKEN" http://localhost:3000/orders/in-progress

# Listar pedidos concluidos
curl -H "Authorization: Bearer $API_TOKEN" http://localhost:3000/orders/concluded

# Listar pedidos cancelados
curl -H "Authorization: Bearer $API_TOKEN" http://localhost:3000/orders/cancelled

# Listar todos os pedidos
curl -H "Authorization: Bearer $API_TOKEN" http://localhost:3000/orders

# Filtrar por status especifico
curl -H "Authorization: Bearer $API_TOKEN" "http://localhost:3000/orders?status=PENDING_PAYMENT"
```

## Estrutura

- `src/discord/commands`: slash commands
- `src/discord/responders`: bot buttons/modals/selects
- `src/discord/events`: eventos do Discord

## Stack

- Node.js 20.12+ (runtime)
- TypeScript (linguagem)
- Discord.js + Constatic (`@constatic/base`) (bot e roteamento)
- Prisma + MongoDB (persistencia de dados)
- TSUP + TSX (build e execucao em dev)

## Desenvolvimento

- Use `npm run check` e `npm run build` apos implementar mudancas.
- Validacoes principais sao manuais no Discord.

## IA e Spec Driven

Este repositorio inclui artefatos para orientar desenvolvimento com agentes de IA e revisao humana:

- `AGENTS.md` define regras operacionais, padroes e fluxos para o trabalho com agentes.
- `docs/adr/*` registra decisoes arquiteturais (ADRs) com contexto e consequencias.
- `docs/adr/tasks/*` detalha a execucao de cada ADR em checklist.

O projeto segue uma abordagem Spec Driven com agentes de IA: as mudancas partem de uma especificacao (ADR + task), sao implementadas de forma iterativa e sempre passam por revisao humana.
