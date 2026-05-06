# Ticket Edit Back Button Tasks

## Implementation

- [x] Add ADR for the ticket edit back button behavior.
- [x] Add task checklist for the approved feature.
- [x] Update `renderCardTypeSelection` to optionally show `Voltar` back to the existing order summary.
- [x] Update `renderSelectedCardType` to optionally show `Voltar` back to card type selection without duplicate confusing buttons.
- [x] Pass the edit back flag from `ticket/details/start` only for submitted orders in review or pending confirmation.
- [x] Pass the same edit back flag from `ticket/details/type`.
- [x] Add `ticket/details/back` responder that validates ticket/user access and returns to the correct summary screen.

## Validation

- [x] Run `npm run check`.
- [x] Run `npm run build`.
- [x] Confirm no unrelated files were changed.
