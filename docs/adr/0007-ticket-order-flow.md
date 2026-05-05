# Ticket Order Flow

## Status
Accepted

## Context
The `/ticket` command already posts the public ticket panel with a `Criar ticket` button, and `/config` already stores the Discord categories for `Tickets Novos`, `Pendentes`, and `Aguardando`.

The next step is to make the `Criar ticket` button open a private order channel where the user can provide the minimum information needed for proxy production, then let an admin assume and confirm the order.

The order price must be calculated from the configured material costs. One A4 sheet produces 8 cards, so the order uses whole-sheet rounding for the required sheet count.

The bot also needs a configurable profit margin, applied to the calculated material cost before showing the final payment amount. Real PIX generation and payment confirmation remain out of scope for this feature.

## Decision
Implement the `ticket/create` responder to create a new text channel under the configured `Tickets Novos` category. The channel uses permissions inherited from the category and explicitly grants access to the requesting user.

Ticket channels are named without spaces, using the Discord username instead of the member server display name:

- New tickets: `⌛|nickname|dd/MM`
- Pending payment: `🛒|nickname|dd/MM`
- Awaiting delivery: `✅|nickname|dd/MM`

Persist each ticket/order in MongoDB with its guild, channel, user, status, responsible admin, selected card type, card count, deck link, sheet count, calculated cost, profit margin, and final price. Multiple active tickets by the same user are allowed.

The ticket channel starts with an initial Components V2 message where the user can either fill the order details or give up on the ticket. Giving up requires confirmation, marks the order as cancelled, and deletes the channel.

The order details are:

- Card type: foil or laminated, limited by the enabled production types in `/config`.
- Card count.
- Deck link, optional when the user wants only specific cards.

After the user submits the details, the bot posts a `Pendencia de confirmacao` message. An admin with `ManageGuild` can click `Assumir pedido`, becoming the responsible admin for that ticket. After assuming, the bot shows the submitted information and lets the admin and user continue the conversation in the channel. The user can edit the submitted information while the order is not confirmed.

When the responsible admin clicks `Confirmar pedido`, the bot recalculates the final price, moves the channel to the configured `Pendentes` category, renames it with the pending-payment prefix, and posts a mock PIX embed with the final value and a fake copy-and-paste code. The mock must clearly state that it is not a real payment QR code.

Add a `/config` setting for profit margin as a percentage. The final price is the material cost plus the configured margin percentage. If the margin is not configured, use 0%.

## Consequences
The project gains the first persisted order lifecycle and can survive bot restarts without losing ticket state.

The feature depends on configured ticket categories and production/material pricing. If required categories or material prices are missing, the bot should block the relevant action with a clear message instead of creating or confirming an incomplete order.

Real PIX generation, payment detection, moving to `Aguardando`, and delivery handling remain future features. The `Aguardando` channel naming convention is documented now so later lifecycle steps can reuse it consistently.
