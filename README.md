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
```

- `BOT_TOKEN` e `DATABASE_URL` sao obrigatorias.
- `WEBHOOK_LOGS_URL` e `GUILD_ID` sao opcionais.

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

## Desenvolvimento

- Use `npm run check` e `npm run build` apos implementar mudancas.
- Validacoes principais sao manuais no Discord.

## IA e Spec Driven

Este repositorio inclui artefatos para orientar desenvolvimento com agentes de IA e revisao humana:

- `AGENTS.md` define regras operacionais, padroes e fluxos para o trabalho com agentes.
- `docs/adr/*` registra decisoes arquiteturais (ADRs) com contexto e consequencias.
- `docs/adr/tasks/*` detalha a execucao de cada ADR em checklist.

O projeto segue uma abordagem Spec Driven com agentes de IA: as mudancas partem de uma especificacao (ADR + task), sao implementadas de forma iterativa e sempre passam por revisao humana.
