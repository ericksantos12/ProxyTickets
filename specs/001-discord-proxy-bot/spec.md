# Feature Specification: Discord Proxy Bot

**Feature Branch**: `001-discord-proxy-bot`  
**Created**: 2026-02-24  
**Status**: Draft  
**Input**: User description: "Bot de Discord para gerenciar pedidos de cartas proxy de Magic com sistema de tickets, pagamento via Pix/Mercado Pago e acompanhamento de status"

**Constitution Alignment**: This specification supports Principle V (User Story Independence) and Principle IV (Test-First Development). Each user story must be independently testable with clear acceptance criteria.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sistema Básico de Tickets (Priority: P1)

Um cliente acessa o servidor Discord e clica em um botão para criar um ticket de pedido. O bot cria automaticamente um canal privado de ticket na categoria apropriada, onde o cliente pode conversar sobre seu pedido de cartas proxy.

**Why this priority**: Este é o ponto de entrada fundamental do sistema. Sem a capacidade de criar e gerenciar tickets, nenhuma outra funcionalidade pode ser utilizada. É o MVP mínimo viável.

**Independent Test**: Pode ser testado completamente criando um ticket via botão, verificando que o canal foi criado na categoria correta, e confirmando que o usuário tem acesso ao canal criado.

**Acceptance Scenarios**:

1. **Given** o servidor Discord possui um canal configurado com mensagem do bot, **When** um usuário clica no botão "Criar Ticket", **Then** um novo canal de ticket é criado na categoria "=== TICKETS NOVOS ===" com permissões apropriadas para o usuário
2. **Given** um canal de ticket foi criado, **When** o bot envia a mensagem inicial, **Then** o usuário vê uma mensagem de boas-vindas explicando o processo
3. **Given** múltiplos usuários criam tickets, **When** cada um clica no botão, **Then** cada usuário recebe seu próprio canal de ticket exclusivo
4. **Given** um usuário já possui um ticket ativo (status não DELIVERED), **When** tenta criar novo ticket, **Then** o bot rejeita a criação e responde com mensagem efêmera: "Você já possui um ticket ativo: #ticket-{username}-###. Complete ou aguarde a entrega do pedido atual antes de criar um novo ticket."

---

### User Story 2 - Formulário de Pedido (Priority: P2)

Após criar o ticket, o cliente interage com um formulário guiado pelo bot para especificar os detalhes do pedido: extras opcionais (deck box e/ou sleeves), quantidade de cartas no deck, e o link da decklist.

**Why this priority**: Esta funcionalidade coleta as informações essenciais necessárias para processar o pedido. Sem ela, não há como saber o que o cliente deseja.

**Independent Test**: Pode ser testado em um canal de ticket existente, enviando as opções de formulário, coletando as respostas do usuário e validando que todos os dados foram capturados corretamente.

**Acceptance Scenarios**:

1. **Given** um canal de ticket foi criado, **When** o bot apresenta o select menu de extras, **Then** o usuário pode selecionar múltiplas opções: deck box, sleeves, ambos, ou nenhum
2. **Given** o usuário selecionou os extras, **When** o bot pergunta a quantidade de cartas, **Then** o bot aceita um número (padrão 100 para Commander) e valida que é um número positivo
3. **Given** o usuário informou a quantidade, **When** o bot solicita o link da decklist, **Then** o bot aceita URLs de sites como LigaMagic ou outros sites de decklist e valida formato usando regex
4. **Given** o usuário fornece URL inválida (não começa com http:// ou https://), **When** o bot valida o input, **Then** rejeita com mensagem: "URL inválida. Por favor forneça um link válido começando com http:// ou https://"
5. **Given** todos os dados foram coletados, **When** o formulário é concluído, **Then** o bot armazena temporariamente todas as informações para a próxima etapa

---

### User Story 3 - Cálculo de Preço e Pagamento (Priority: P3)

O bot calcula automaticamente o valor total do pedido baseado na quantidade de cartas (considerando 9 cartas por folha), extras selecionados e custos de materiais configurados. Apresenta o valor e gera um QR Code do Mercado Pago para pagamento via Pix.

**Why this priority**: A monetização é essencial para viabilizar o negócio. Esta história conecta a coleta de informações ao recebimento do pagamento.

**Independent Test**: Pode ser testado fornecendo dados de pedido simulados, verificando o cálculo correto do preço, e confirmando que a chave Pix e QR Code são apresentados com o formato especificado.

**Acceptance Scenarios**:

1. **Given** um pedido com 100 cartas sem extras, **When** o bot calcula o preço, **Then** o cálculo considera: ceil(100/9) folhas × preço_folha + custo_tinta + custo_plastificação
2. **Given** um pedido inclui deck box e/ou sleeves, **When** o bot calcula o preço, **Then** os valores configurados para esses extras são adicionados ao total
3. **Given** o valor foi calculado, **When** o bot apresenta o pagamento, **Then** exibe chave Pix, QR Code do Mercado Pago e valor exato no formato especificado
3. **Given** o pagamento foi apresentado, **When** o canal é atualizado, **Then** o canal move para categoria "=== PENDENTES ===" e timestamp de expiração é registrado (24 horas a partir de agora)
4. **Given** um pagamento está pendente por 23 horas, **When** o sistema verifica timeouts, **Then** envia mensagem de aviso ao usuário: "Atenção: Seu pagamento expira em 1 hora. Complete o pagamento para evitar cancelamento automático."
5. **Given** um pagamento está pendente por 24 horas sem confirmação, **When** o sistema verifica timeouts, **Then** ticket move para status EXPIRED, canal é arquivado, e mensagem final é enviada: "Este ticket expirou devido a pagamento não concluído. Crie um novo ticket quando estiver pronto para prosseguir."

---

### User Story 4 - Processamento de Pagamento e Mudança de Status (Priority: P4)

O sistema monitora o status do pagamento via Mercado Pago. Quando o pagamento é confirmado, atualiza a mensagem de "Processando" para "Aprovado", move o ticket para a categoria apropriada e notifica o administrador.

**Why this priority**: Automatiza o fluxo de trabalho ao confirmar pagamentos, reduzindo intervenção manual e melhorando a experiência do cliente.

**Independent Test**: Pode ser testado simulando callbacks do Mercado Pago ou alterando manualmente status de pagamento, verificando que o canal muda de categoria e mensagens são atualizadas.

**Acceptance Scenarios**:

1. **Given** um pagamento está pendente, **When** o Mercado Pago confirma o pagamento, **Then** a mensagem atualiza de status "Processando" para "Aprovado"
2. **Given** o pagamento foi aprovado, **When** a confirmação é recebida, **Then** o canal move para categoria "=== APROVADO ==="
3. **Given** o pagamento foi aprovado, **When** o status é atualizado, **Then** o pedido é salvo no banco de dados SQLite com todos os detalhes
4. **Given** o pedido foi salvo no banco, **When** a operação é concluída, **Then** o administrador recebe uma mensagem privada no Discord com os detalhes do novo pedido
5. **Given** um pagamento foi aprovado, **When** Mercado Pago envia webhook de cancelamento/reembolso, **Then** ticket move para status CANCELLED, canal é arquivado, e notificações são enviadas ao cliente ("Seu pedido foi cancelado devido a cancelamento de pagamento") e admin ("Pedido #XXX cancelado - pagamento reembolsado")

---

### User Story 5 - Painel Administrativo de Gestão (Priority: P5)

O administrador tem acesso a um canal privado onde pode visualizar todos os pedidos pagos, marcar pedidos como "prontos para entrega", e posteriormente como "entregue" para arquivamento.

**Why this priority**: Fornece controle operacional completo sobre o ciclo de vida dos pedidos, desde aprovação até entrega final.

**Independent Test**: Pode ser testado criando pedidos simulados no banco de dados, acessando o painel admin, e verificando que as ações de mudança de status funcionam corretamente.

**Acceptance Scenarios**:

1. **Given** o administrador está no canal privado de gestão, **When** solicita a lista de pedidos pagos, **Then** o bot exibe todos os pedidos da tabela de aprovados com detalhes relevantes
2. **Given** um pedido está listado como aprovado, **When** o administrador marca como "pronto para entrega", **Then** o pedido move da tabela de aprovados para tabela "prontos_para_entrega"
3. **Given** um pedido está pronto para entrega, **When** o administrador marca como "entregue", **Then** o pedido move para tabela de arquivamento "entregues"
4. **Given** o administrador tem permissões corretas, **When** tenta acessar comandos admin, **Then** apenas o administrador configurado pode executar essas ações

---

## Clarifications

### Session 2026-02-24

- Q: How should the system handle users creating multiple simultaneous tickets? → A: Strictly one ticket per user (reject new creation until current delivered)
- Q: How long can a ticket remain in PENDENTES status before being considered expired? → A: 24 hours auto-expire with notification
- Q: How should the system validate decklist URLs? → A: Basic URL format validation only (regex check)
- Q: What happens if an approved payment is later cancelled or refunded by Mercado Pago? → A: Cancel order automatically, archive ticket immediately
- Q: How should the system handle Mercado Pago API failures during payment generation? → A: Retry with exponential backoff (3 attempts), temporary error message

---

### Edge Cases

- **Pagamento cancelado ou reembolsado**: ✅ **RESOLVED** - Sistema cancela pedido automaticamente quando Mercado Pago envia webhook de cancelamento/reembolso. Ticket move para status CANCELLED, canal é arquivado, cliente e admin recebem notificações. Dados do pedido preservados no banco para auditoria.
- **Timeout de pagamento**: ✅ **RESOLVED** - Tickets em status PENDENTES expiram automaticamente após 24 horas. Sistema envia notificação ao usuário 1 hora antes da expiração e move ticket para status EXPIRED quando o prazo é alcançado. Canal é arquivado após expiração.
- **Links de decklist inválidos**: ✅ **RESOLVED** - Sistema aplica apenas validação básica de formato URL usando regex. Não verifica acessibilidade ou conteúdo. Admin revisa links durante processamento de pedidos. Mantém implementação simples por Princípio II (Simplicity First).
- **Múltiplos tickets do mesmo usuário**: ✅ **RESOLVED** - Sistema permite apenas um ticket ativo por usuário. Tentativas de criar novo ticket são rejeitadas com mensagem explicativa até que o ticket atual seja marcado como "DELIVERED".
- **Falha na comunicação com Mercado Pago**: ✅ **RESOLVED** - Sistema implementa retry com exponential backoff (3 tentativas: 1s, 2s, 4s). Mostra mensagem temporária "Processando pagamento..." durante retries. Se todas tentativas falharem, exibe erro: "Erro ao gerar pagamento. Tente novamente em alguns minutos." e notifica admin sobre falha persistente.
- **Quantidade de cartas inválida**: Como validar entradas como números negativos, zero, ou números extremamente grandes?
- **Configuração de preços não definida**: O que acontece se o administrador não configurou os valores dos materiais?

## Requirements *(mandatory)*

### Functional Requirements

**Sistema de Tickets**
- **FR-001**: Sistema MUST criar canal de ticket privado quando usuário clica no botão de criação
- **FR-002**: Sistema MUST organizar tickets em categorias: "TICKETS NOVOS", "PENDENTES", "APROVADO"
- **FR-003**: Sistema MUST garantir permissões adequadas para cada canal de ticket (acesso apenas ao criador e administrador)
- **FR-004**: Sistema MUST exibir mensagem de boas-vindas ao criar o ticket
- **FR-004A**: Sistema MUST enforce strict one-ticket-per-user rule: reject creation attempts when user has an active ticket (status not DELIVERED) with clear error message

**Coleta de Informações**
- **FR-005**: Sistema MUST apresentar select menu com opções múltiplas para extras (deck box, sleeves, ambos, nenhum)
- **FR-006**: Sistema MUST solicitar quantidade de cartas com valor padrão de 100
- **FR-007**: Sistema MUST validar que quantidade de cartas é um número positivo maior que zero
- **FR-008**: Sistema MUST aceitar link de decklist de múltiplos sites (LigaMagic e outros sites de decklist)
- **FR-008A**: Sistema MUST validate decklist URL using basic regex pattern (^https?://.*) and reject invalid formats with clear error message
- **FR-009**: Sistema MUST armazenar todas as informações coletadas do formulário

**Cálculo de Preços**
- **FR-010**: Sistema MUST calcular número de folhas necessárias usando fórmula: ceil(quantidade_cartas / 9)
- **FR-011**: Sistema MUST aplicar custos configuráveis para: folha fotográfica, tinta, plastificação
- **FR-012**: Sistema MUST adicionar valores de extras selecionados ao cálculo total
- **FR-013**: Sistema MUST permitir que administrador configure valores de materiais e extras
- **FR-014**: Sistema MUST apresentar valor total calculado antes de solicitar pagamento

**Pagamento**
- **FR-015**: Sistema MUST gerar chave Pix válida para pagamento
- **FR-016**: Sistema MUST gerar QR Code do Mercado Pago com valor exato do pedido
- **FR-016A**: Sistema MUST implement exponential backoff retry for Mercado Pago API calls (3 attempts: 1s, 2s, 4s delays)
- **FR-016B**: Sistema MUST display temporary "Processando pagamento..." message during retry attempts
- **FR-016C**: Sistema MUST show user-friendly error after all retries fail: "Erro ao gerar pagamento. Tente novamente em alguns minutos."
- **FR-016D**: Sistema MUST notify admin via DM when Mercado Pago API failures persist after all retries
- **FR-017**: Sistema MUST exibir informações de pagamento no formato especificado (chave Pix + QR Code)
- **FR-018**: Sistema MUST monitorar status de pagamento via webhooks ou polling do Mercado Pago
- **FR-019**: Sistema MUST atualizar mensagem de "Processando" para "Aprovado" quando pagamento confirmado
- **FR-019A**: Sistema MUST handle payment refund/cancellation webhooks from Mercado Pago
- **FR-019B**: Sistema MUST automatically cancel order and move ticket to CANCELLED status when payment is refunded/cancelled
- **FR-019C**: Sistema MUST archive ticket channel within 5 minutes of cancellation
- **FR-019D**: Sistema MUST notify both customer and admin when order is cancelled due to payment refund

**Gestão de Status**
- **FR-020**: Sistema MUST mover canal de ticket entre categorias conforme status do pedido
- **FR-021**: Sistema MUST salvar pedido aprovado em banco de dados SQLite
- **FR-022**: Sistema MUST enviar notificação privada ao administrador quando pagamento aprovado
- **FR-023**: Sistema MUST incluir todos os detalhes do pedido na notificação (cliente, itens, valor, link decklist)
- **FR-023A**: Sistema MUST implement 24-hour payment timeout: tickets in PENDENTES status auto-expire after 24 hours
- **FR-023B**: Sistema MUST send warning notification to user 1 hour before payment expiration
- **FR-023C**: Sistema MUST move expired tickets to EXPIRED status and archive channel after timeout

**Painel Administrativo**
- **FR-024**: Sistema MUST restringir comandos administrativos apenas ao usuário administrador configurado
- **FR-025**: Sistema MUST listar pedidos aprovados em canal privado de gestão
- **FR-026**: Sistema MUST permitir administrador marcar pedidos como "pronto para entrega"
- **FR-027**: Sistema MUST mover pedidos entre tabelas do banco de dados conforme status (aprovado → pronto → entregue)
- **FR-028**: Sistema MUST manter histórico de todos os pedidos na tabela de arquivamento

### Key Entities

- **Ticket**: Representa um pedido de cliente. Atributos: ID do canal Discord, ID do usuário, timestamp de criação, status (NEW/COLLECTING/PENDING/APPROVED/READY/DELIVERED/EXPIRED/CANCELLED), ID do pedido associado

- **Pedido (Order)**: Representa os detalhes de um pedido de cartas proxy. Atributos: quantidade de cartas, extras selecionados (deck_box boolean, sleeves boolean), link da decklist, valor total calculado, status de pagamento

- **Configuração de Preços (PriceConfig)**: Armazena valores configuráveis de materiais. Atributos: preço por folha fotográfica, custo de tinta por impressão, custo de plastificação, valor de deck box, valor de sleeves

- **Pagamento (Payment)**: Registra informações de pagamento. Atributos: ID do pedido, valor, chave Pix gerada, ID da transação Mercado Pago, status (pendente/aprovado/cancelado), timestamp

- **Admin**: Identifica usuário(s) com permissões administrativas. Atributos: Discord User ID, permissões concedidas

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Clientes podem criar um ticket e enviar pedido completo em menos de 3 minutos
- **SC-002**: Sistema calcula preço correto em 100% dos casos baseado nas regras definidas (folhas = ceil(cartas/9))
- **SC-003**: Pagamentos aprovados são detectados e processados em menos de 2 minutos após confirmação do Mercado Pago
- **SC-004**: Administrador recebe notificação imediata (< 30 segundos) de todos os novos pedidos pagos
- **SC-005**: 100% dos pedidos são rastreáveis desde criação até entrega através do banco de dados
- **SC-006**: Sistema mantém organização de canais com 100% dos tickets nas categorias corretas conforme status
- **SC-007**: Administrador consegue localizar e atualizar status de qualquer pedido em menos de 1 minuto
- **SC-008**: Zero perda de dados de pedidos (todos são salvos no banco de dados antes de confirmação ao cliente)
- **SC-009**: Sistema recupera automaticamente de falhas transitórias da API Mercado Pago em >90% dos casos através do mecanismo de retry

### Non-Functional Requirements

- **NFR-001**: Retry logic MUST use exponential backoff (delays: 1s, 2s, 4s) to avoid overwhelming failed services
- **NFR-002**: Error messages MUST be user-friendly and actionable (avoid technical jargon)
- **NFR-003**: All external API failures MUST be logged with full error details for debugging
- **NFR-004**: Admin notifications for persistent failures MUST include timestamp, error type, and affected order ID

## Assumptions

Esta seção documenta as decisões e suposições razoáveis feitas durante a especificação:

1. **Plataforma de Pagamento**: Mercado Pago foi escolhido como plataforma de pagamento pois suporta Pix e é amplamente usado no Brasil. Sistema irá usar webhooks do Mercado Pago para notificações de pagamento em tempo real.

2. **Fórmula de Cálculo**: A regra de 9 cartas por folha é padrão para impressão de proxies em folha A4. O cálculo usa ceil() para arredondar para cima (ex: 91 cartas = 11 folhas).

3. **Banco de Dados**: SQLite foi escolhido por ser leve e adequado para volumes moderados de transações. Não requer servidor separado e é suficiente para um negócio de proxies artesanal.

4. **Permissões Discord**: Sistema assume permissões adequadas do bot para criar canais, mover canais entre categorias, enviar mensagens privadas e gerenciar permissões de canais.

5. **Validação de Links**: Sistema aceita URLs de qualquer site de decklist. Validação básica verifica apenas formato de URL usando regex (não verifica acessibilidade ou parsing de conteúdo). Admin revisa links manualmente durante processamento de pedidos. Esta abordagem mantém implementação simples conforme Princípio II da constituição, evitando complexidade de HTTP requests, HTML parsing e lógica site-específica.

6. **Timeout de Pagamento**: Pagamentos pendentes expiram automaticamente após 24 horas. Sistema envia aviso 1 hora antes da expiração. Após expiração, ticket move para status EXPIRED e canal é arquivado. Isto previne acumulação de canais inativos e incentiva conclusão rápida de pagamentos.

7. **Múltiplos Tickets**: Sistema aplica regra estrita de um ticket por usuário. Usuários não podem criar novo ticket até que o ticket atual seja marcado como "DELIVERED". Isto previne proliferação de tickets, simplifica a experiência do usuário e reduz carga administrativa.

8. **Idioma**: Sistema opera em português brasileiro, adequado ao mercado-alvo (Brasil).

9. **Formato do QR Code**: Sistema usa imagem de QR Code gerada pela API do Mercado Pago seguindo formato especificado pelo usuário.

10. **Canal de Configuração**: Administrador configura preços através de comandos do bot em canal privado. Valores são persistidos no banco de dados.

11. **Notificações**: Notificações privadas ao administrador usam DMs (Direct Messages) do Discord. Se DMs estiverem desabilitadas, sistema tentará mencionar em canal privado administrativo.

12. **Arquivamento**: Pedidos entregues são movidos para tabela de arquivo mas nunca deletados, mantendo histórico completo para fins de auditoria e análise.

## Out of Scope

As seguintes funcionalidades NÃO fazem parte deste MVP inicial:

- Parsing automático de decklists para extrair nomes das cartas
- Integração com APIs de sites de decklist (LigaMagic, Moxfield, etc.)
- Sistema de avaliações ou feedback de clientes
- Rastreamento de envio/entrega física dos produtos
- Catálogo de deck boxes e sleeves com diferentes modelos
- Sistema de descontos ou cupons promocionais
- Múltiplos administradores com diferentes níveis de permissão
- Dashboard web para gestão (apenas Discord)
- Cancelamento de pedidos pelo cliente após pagamento
- Suporte a outros métodos de pagamento além de Pix via Mercado Pago
- Estimativas de tempo de produção/entrega
- Galeria de pedidos anteriores ou portfólio
- Sistema de perguntas frequentes (FAQ) automatizado
- Tradução para outros idiomas
