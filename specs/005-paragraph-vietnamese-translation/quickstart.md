# Quickstart: Paragraph-Level Vietnamese Translation & Management

## Prerequisites

- Node.js 20 or newer
- pnpm installed
- Existing `.env.local` values for Firebase and OpenRouter
- A signed-in Vocab Miner account
- Firebase Functions dependencies installed from `functions/`

## Static Validation

From the repository root:

```bash
pnpm lint
pnpm --dir functions lint
```

Both commands must exit with code `0`. The project constitution prohibits adding automated test infrastructure; validation is manual plus lint.

## Scenario 1: Display and Association

1. Open a saved multi-paragraph passage with at least two available translations.
2. Expand the translation control for the first paragraph and confirm only its Vietnamese text appears directly below it.
3. Expand the second paragraph while the first remains open and confirm both translations stay paired with their own source paragraphs.
4. Collapse the first paragraph and confirm its source text remains in place.

Expected result: expand/collapse state is independent per paragraph and does not alter source text or neighboring content.

## Scenario 2: New Passage Generation

1. Submit a valid passage containing at least three non-empty blocks separated by blank lines through the existing Extract Vocab flow.
2. Leave the submission view and open the new passage from history.
3. Refresh or wait for background processing to finish.
4. Confirm the vocabulary result and paragraph translations become available independently.
5. Force or simulate one translation-provider failure if the environment supports it.

Expected result: each paragraph has its own translation state; a failed paragraph offers retry/manual entry while the saved passage, vocabulary, and successful translations remain usable.

## Scenario 3: Existing Passage Manual CRUD

1. Open a legacy or deliberately incomplete passage with a missing paragraph translation.
2. Select Add Translation, enter non-empty Vietnamese text, and save.
3. Edit the saved text, then cancel a second edit and confirm the saved value is unchanged.
4. Delete the translation and confirm the paragraph returns to Add Translation.
5. Refresh the passage.

Expected result: the selected paragraph persists the intended state across refresh and no other paragraph or vocabulary item changes.

## Scenario 4: Individual AI Generate and Regenerate

1. On a missing paragraph, select Generate with AI and observe paragraph-local progress.
2. While it runs, read the passage and use a word action or control on another paragraph.
3. On an available paragraph, select Regenerate and confirm the new result replaces the old one only after success.
4. Simulate provider failure during regeneration.

Expected result: unrelated paragraph interactions remain available; a failed generation is actionable and preserves the previous translation when one existed.

## Scenario 5: Ownership and Concurrency

1. Sign in as user A and record a passage ID and paragraph ID.
2. Attempt to read or mutate those IDs while authenticated as user B.
3. Trigger two generate/regenerate requests for the same paragraph, or use two browser tabs.
4. Trigger operations for different paragraphs at the same time.

Expected result: user B receives an authorization/not-found response; one same-paragraph operation is authoritative; different paragraphs can proceed independently.

## Scenario 6: Abandoned AI Operation

1. Start an AI generation request for a paragraph.
2. Terminate the request before completion or simulate a worker crash.
3. Wait until the translation operation lease expires.
4. Retry generation or enter a manual edit.
5. Confirm the paragraph is no longer permanently blocked and any previous translation remains intact.

Expected result: an expired claim is reclaimed transactionally, stale provider responses cannot overwrite a newer result, and the paragraph remains recoverable.

See [data-model.md](data-model.md) for state transitions and [contracts/paragraph-translation-api.md](contracts/paragraph-translation-api.md) for request and response details.
