# Show Price Before PIX Tasks

## Implementation

- [x] Update `renderPendingConfirmation` to require `CardOrderPrice` and show the total value.
- [x] Update `renderOrderReview` to require `CardOrderPrice` and show the total value.
- [x] Update `ticket/details/submit` to calculate price before rendering pending confirmation or order review.
- [x] Update `ticket/claim` to calculate price before rendering order review.
- [x] Update `ticket/details/back` to calculate price before rendering pending confirmation or order review.
- [x] Block rendering with the existing pricing error when `calculateCardOrderPrice` fails.

## Validation

- [x] Run `npm run check`.
- [x] Run `npm run build`.
- [ ] Manually verify pending confirmation shows total price.
- [ ] Manually verify in-review shows total price.
- [ ] Manually verify incomplete pricing config blocks with an ephemeral error.
