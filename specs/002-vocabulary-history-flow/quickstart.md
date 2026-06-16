# Quickstart: Validate Vocabulary Extraction & History Flow

## Purpose

Validate the end-to-end behavior for dashboard extraction, automatic detail redirect, two-panel contextual review, and sidebar passage-history navigation.

## Prerequisites

- Node.js 20+
- pnpm installed
- Firebase Auth and Firestore configured for user-scoped access
- OpenRouter extraction integration configured for server-side route handlers

## Setup

1. Install dependencies.

```bash
pnpm install
```

2. Configure local environment variables in .env.local for Firebase and extraction provider.

3. Run lint quality gate.

```bash
pnpm lint
```

Expected outcome: exits with code 0.

## Run App

```bash
pnpm dev
```

Open the application on local development URL.

## Validation Scenarios

### Scenario 1: Dashboard Required Inputs

1. Sign in and open dashboard.
2. Try submit with title only, then with passage only.
3. Provide both title and passage and submit.

Expected outcomes:

- Submission is blocked until both fields are provided.
- Clear feedback indicates missing input.
- Valid submission triggers extraction request.

### Scenario 2: Successful Save And Redirect

1. Submit valid title and passage.
2. Wait for extraction completion.

Expected outcomes:

- Record is saved with title, passage, and vocabularyList shape.
- User is automatically navigated to the detail page of saved record.

### Scenario 3: Detail Two-Panel Rendering

1. On detail page, verify left panel and right panel contents.

Expected outcomes:

- Left panel shows full passage text.
- Right panel shows extracted vocabulary words.

### Scenario 4: Click-To-Highlight

1. Click a vocabulary item in right panel.
2. Click multiple different words.
3. Click an item that has no direct match in the rendered passage.

Expected outcomes:

- Matching occurrences highlight in passage panel.
- If no matches are found, user sees explicit no-match feedback.

### Scenario 5: Sidebar Passage History Navigation

1. Return to dashboard after creating multiple records.
2. Confirm the dashboard card title is Passage History (not Vocabulary Bank).
3. Open account dropdown and confirm History is removed from the menu.
4. Click a passage history item.

Expected outcomes:

- Standalone history route is removed from primary nav.
- Vocabulary Bank section is replaced by Passage History.
- Clicking history item opens matching detail page.

### Scenario 6: Failure Modes

1. Simulate extraction provider failure.
2. Simulate save failure.
3. Simulate history loading failure.
4. Open a deleted/missing record detail URL.

Expected outcomes:

- Each failure displays clear user-facing feedback.
- Missing/deleted record state provides a recovery action back to dashboard.
- No cross-user data is shown in any state.

## References

- Feature spec: specs/002-vocabulary-history-flow/spec.md
- Plan: specs/002-vocabulary-history-flow/plan.md
- Research: specs/002-vocabulary-history-flow/research.md
- Data model: specs/002-vocabulary-history-flow/data-model.md
- Contract: specs/002-vocabulary-history-flow/contracts/extraction-history-flow-api.md
