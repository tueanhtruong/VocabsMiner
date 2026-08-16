# Quickstart: Background Vocabulary Extraction

## Prerequisites

- Node.js 20+ and pnpm 10+
- Existing Firebase project with Auth and Firestore enabled
- Firebase Functions deployment access for the project
- OpenRouter API key configured for both the Next.js server and the Functions worker

## Local Validation

1. Install dependencies with `pnpm install`.
2. Start the Next.js app with `pnpm dev`.
3. Sign in and submit a valid passage from `/dashboard`.
4. Confirm the submission returns to a usable page quickly and the new history item shows `pending` with zero words.
5. Open `/dashboard/history`, navigate elsewhere, then return and confirm the item changes to `completed` after the worker finishes.
6. Open the completed passage detail and confirm the saved passage and vocabulary list are available.

## Failure and Retry Validation

1. Configure the extraction provider to fail or temporarily remove its worker credential in a controlled development environment.
2. Submit a passage and confirm history eventually shows `error` while retaining the title and passage preview.
3. Open the detail view and confirm an error message and Retry action are shown.
4. Restore the provider, select Retry, and confirm the record returns to `pending` without creating a second history item.
5. Confirm a successful retry changes the same record to `completed`.

## Duplicate and Navigation Validation

- Select Retry repeatedly or refresh while a retry is pending; verify only one active attempt owns the record and the final result is from the current claim.
- Close the browser after submitting and revisit history later; verify status was updated by the background worker independently of the original browser session.
- Submit a passage that yields no vocabulary; verify it becomes `completed` with an empty list rather than `error`.

## Required Quality Gate

Run `pnpm lint` from the repository root after each implementation task. It must exit with code 0; existing warnings must not become errors.

## Deployment Check

Deploy the Firebase Functions worker using the repository's Firebase project workflow, then verify the Firestore trigger observes a newly created pending passage. Do not treat a local Next.js-only fire-and-forget run as proof of background durability.
