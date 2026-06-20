# Data Model: Word Action Menu

## Entities

### Selected Word

- Represents the exact text highlighted in the passage panel.
- Fields: `text`, `recordId`, `selectionRange`, `sourcePassageSnippet`.
- Validation: must be non-empty and must come from the current passage detail view.
- Relationship: drives both translation and draft generation.

### Translation Preview

- Represents the Vietnamese translation returned for a selected word.
- Fields: `sourceText`, `vietnamese`, `status`, `errorMessage`.
- Validation: `vietnamese` may be empty only when `status` indicates failure.
- Relationship: attached to the current selected word and shown in the popup menu.

### Vocabulary Draft

- Represents prefilled values for the add-new-vocabulary form.
- Fields: `word`, `type`, `phonetic`, `definition`, `vietnamese`, `sourceText`, `recordId`.
- Validation: `word` must be present; other fields may be partial but must be safe to display and edit.
- Relationship: created from the selected word and opened in the existing add vocabulary dialog.

### Add Vocabulary Form State

- Represents the editable form inside the vocabulary panel.
- Fields: `word`, `type`, `phonetic`, `definition`, `vietnamese`, plus UI state for open/closed and validation errors.
- Validation: the existing save rules still apply before a vocabulary item can be persisted.
- Relationship: receives the generated draft and can still be edited before calling the current save route.

## State Transitions

1. `Selected Word` is created when the learner highlights text in the passage panel.
2. `Translation Preview` moves from idle to loading to ready or failed after the translation action.
3. `Vocabulary Draft` moves from idle to loading to ready or failed after the draft action.
4. `Add Vocabulary Form State` opens with the draft values, then transitions through user edits, validation, and save.

## Validation Rules

- The popup should only appear for actual text selections, not for empty selections.
- Translation feedback should always stay in the passage detail experience; it must not navigate away.
- Draft generation should preserve any user-entered form values if the dialog is already open.
- The final save still requires the existing vocabulary form validation rules to pass.
