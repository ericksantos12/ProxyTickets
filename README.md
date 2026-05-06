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
```

- `BOT_TOKEN`, `DATABASE_URL` e `MP_ACCESS_TOKEN` sao obrigatorias.
- `WEBHOOK_LOGS_URL`, `GUILD_ID`, `MP_SANDBOX` e `MP_TEST_PAYER_EMAIL` sao opcionais.

### Detalhes do .env

- `BOT_TOKEN`: token do bot do Discord.
- `DATABASE_URL`: string de conexao do MongoDB usada pelo Prisma.
- `NODE_OPTIONS`: opcoes adicionais do Node.js (ex: `--max-old-space-size=4096`).
- `WEBHOOK_LOGS_URL`: webhook para logs do bot.
- `GUILD_ID`: ID do servidor para registrar comandos em escopo de guild.
- `MP_ACCESS_TOKEN`: Access Token do Mercado Pago.
- `MP_SANDBOX`: quando `true`, envia `X-Test-Token` nas chamadas do Mercado Pago. Use `false` somente em producao.
- `MP_TEST_PAYER_EMAIL`: email usado como pagador em sandbox pela Orders API. Padrao: `test@testuser.com`.

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
