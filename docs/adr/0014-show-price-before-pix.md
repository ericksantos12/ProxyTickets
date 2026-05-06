# Show Price Before PIX

## Status
Accepted

## Context
Before the admin confirms an order and generates the PIX, the customer and admin review the order details in the pending confirmation and in-review screens. These screens currently show card type, quantity, and deck link, but not the calculated total price.

The price is only displayed after the admin confirms the order and the PIX is generated. This makes the pre-payment discussion less transparent because the customer cannot see the estimated cost while reviewing the order.

## Decision
Show the calculated total price in the pending confirmation and in-review ticket embeds before PIX generation.

The bot will calculate the price using the same `calculateCardOrderPrice` function used by the PIX generation flow. If pricing cannot be calculated because configuration is incomplete, the action that would render those review screens will be blocked with the existing pricing error instead of showing an embed without price.

## Alternatives Considered

### Omit price when pricing config is incomplete

- **Pros**: Keeps the flow moving even with incomplete configuration.
- **Cons**: The user still does not see a reliable estimate, and the admin would later be blocked when confirming the PIX.
- **Why not**: The user chose to block the action when the price cannot be calculated.

### Store pre-payment price early

- **Pros**: Avoids recalculating price across screens.
- **Cons**: Adds persistence and stale-price concerns before the order is confirmed.
- **Why not**: The existing confirmation flow already calculates price on demand, and this feature only needs display-time estimates.

## Consequences

### Positive

- Customers see the expected total before PIX generation.
- Admins and customers discuss the same price during review.
- Pricing remains consistent with the existing PIX generation calculation.

### Negative

- Additional responders must calculate price before rendering review screens.
- Incomplete pricing configuration blocks earlier in the flow.

### Risks

- If configuration changes between review and PIX generation, the displayed estimate may differ from the final PIX value. This matches the current dynamic configuration behavior and is acceptable until pricing is persisted earlier.
