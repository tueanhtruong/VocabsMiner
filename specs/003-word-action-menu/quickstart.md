# Quickstart: Word Action Menu

## Prerequisites

- A configured local development environment for VocabsMiner.
- Required environment variables for the existing Firebase and OpenRouter setup.
- A valid OpenRouter API key for draft generation.

## Run the App

1. Install dependencies if needed with `pnpm install`.
2. Start the app with `pnpm dev`.
3. Open a saved passage detail page under `/dashboard/passages/[recordId]`.
4. Make sure you are signed in, because the popup actions use the authenticated session header.

## Validate Translation

1. Select a word in the left-side passage panel.
2. Confirm a popup menu appears anchored to the selection.
3. Choose the first menu action.
4. Confirm the selected word is translated to Vietnamese and shown in the popup.
5. Click outside the popup or select another word to dismiss the translation preview.

## Validate Vocabulary Drafting

1. Select a word in the passage panel.
2. Choose the draft-generation action.
3. Confirm the add-new-vocabulary dialog opens in the right-side panel.
4. Confirm the form is prefilled with the generated draft values and can still be edited before saving.
5. Submit the form only after reviewing the suggested word, definition, phonetic field, and Vietnamese translation.

## Validate Save Flow

1. Adjust any prefilled values if needed.
2. Submit the add vocabulary form.
3. Confirm the new vocabulary item is stored through the existing vocabulary save route and appears in the passage vocabulary list.
4. Re-open the passage and repeat the flow to confirm the popup and draft prefill work on repeated selections.

## Validation Command

- Run `pnpm lint` before closing the task.

## Notes

- Translation and drafting are review steps only; they should not auto-save anything.
- The feature should keep the learner on the same passage detail page throughout the flow.
- The popup first translates the selected word to Vietnamese, then can hand off a draft into the add vocabulary dialog.
