# Quickstart: Validate Vocab Extraction Authentication

## Purpose

Run an end-to-end validation of Google-authenticated vocabulary extraction, Firestore persistence, and profile history visibility.

## Prerequisites

- Node.js 20+
- pnpm installed
- Firebase project configured with:
  - Google sign-in enabled in Firebase Auth
  - Firestore database enabled
  - Security rules enforcing user UID isolation
- OpenRouter API key available for server-side use

## Environment Setup

1. Install dependencies:

```bash
pnpm install
```

2. Configure local environment variables in `.env.local` (values intentionally omitted):

- Firebase client config keys
- Firebase admin/service config if used by server route handlers
- OpenRouter API key

3. Run lint quality gate:

```bash
pnpm lint
```

Expected outcome: command exits with code `0`.

## Run Application

```bash
pnpm dev
```

Open app in browser at local development URL (`http://localhost:3000`).

## Validation Scenarios

### Scenario 1: Authentication Gate (P1)

1. Open app while logged out.
2. Attempt to access extraction action.

Expected outcomes:

- User is blocked from extraction until sign-in.
- Google sign-in option is presented as the only login method.

### Scenario 2: Successful Google Sign-In and UID Ownership

1. Complete Google sign-in.
2. Confirm redirect to `/dashboard`.
3. Submit a valid passage for extraction.

Expected outcomes:

- Extraction flow becomes available after sign-in.
- New passage and resulting vocabulary records persist under signed-in user's UID.

### Scenario 3: Vocabulary Extraction and Save

1. Paste a dense academic passage.
2. Trigger extraction.

Expected outcomes:

- Response contains extracted vocabulary items with definition and context.
- Items are stored and retrievable in dashboard Vocabulary Bank (`/dashboard`).

### Scenario 4: Duplicate Handling

1. Submit a second passage that includes previously extracted words.

Expected outcomes:

- Duplicate words are merged/updated, not blindly duplicated.
- Vocabulary history remains coherent and queryable.

### Scenario 5: Profile History View

1. Open `/dashboard/history` after multiple extraction runs.

Expected outcomes:

- Reading passage history is visible.
- Vocabulary list history is visible.
- Data shown belongs only to currently authenticated user.

### Scenario 6: Pagination & Filtering

1. Create enough vocabulary/passage records to exceed one page.
2. In `/dashboard`, use "Load more" for vocabulary and apply a prefix filter.
3. In `/dashboard/history`, use "Load more passages" and "Load more vocabulary".

Expected outcomes:

- Cursor pagination loads additional records without duplicates.
- Prefix query (`q`) only returns matching vocabulary starts.

### Scenario 7: Failure Handling

1. Trigger each failure mode safely (invalid/empty passage, provider failure simulation, storage failure simulation).

Expected outcomes:

- Clear user-facing error message for each failure type.
- No cross-user data leakage.

## References

- Feature spec: `specs/001-vocab-extraction-auth/spec.md`
- Data model: `specs/001-vocab-extraction-auth/data-model.md`
- Contracts: `specs/001-vocab-extraction-auth/contracts/extraction-api.md`
