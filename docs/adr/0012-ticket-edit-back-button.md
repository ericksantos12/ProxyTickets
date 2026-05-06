# Ticket Edit Back Button

## Status
Accepted

## Context
Users can edit ticket order details after an order has already been submitted and is either pending admin confirmation or in review with an assigned admin. The edit flow currently reuses the same screens as the initial details flow, so the only visible escape action is `Desistir`, which starts ticket cancellation.

This is confusing after an order has already been claimed or reviewed because the user may only want to abandon editing and return to the current order summary without cancelling the ticket.

## Decision
Add a `Voltar` button only when the edit-details flow is entered for an order that already has details and is in `IN_REVIEW` or `PENDING_CONFIRMATION`.

The initial `AWAITING_USER_DETAILS` flow will not show this button, preserving the current first-time order entry behavior.

In the card type selection screen, `Voltar` returns to the current order summary: `renderOrderReview` for `IN_REVIEW` orders with a responsible admin, or `renderPendingConfirmation` for `PENDING_CONFIRMATION` orders.

In the selected card type screen, `Voltar` goes back one step to the card type selection screen. The existing `Trocar tipo` action is removed in this edit context to avoid duplicate actions that both return to selection.

## Consequences
Users can safely abandon detail edits without triggering cancellation.

The button is intentionally unavailable during initial detail entry because there is no prior order summary to return to.

The responder must reconstruct existing order details from persisted ticket data before rendering the previous summary.
