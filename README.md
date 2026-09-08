# VocabsMiner

VocabsMiner is a Next.js App Router app that requires Google sign-in (Firebase Auth), extracts academic vocabulary from reading passages via OpenRouter, and stores user-scoped learning history in Firestore.

## Tech Stack

- Next.js 16 + React 19 + TypeScript
- Firebase Auth + Firestore
- OpenRouter Chat Completions API
- ESLint 9 (`pnpm lint`) as the quality gate

## Prerequisites

- Node.js 20+
- pnpm 10+
- Firebase project with:
  - Google provider enabled in Firebase Auth
  - Firestore database enabled
- OpenRouter API key

## Environment Variables

Copy `.env.example` to `.env.local` and set all required variables.

Required groups:

- Firebase client app variables:
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `NEXT_PUBLIC_FIREBASE_APP_ID`
- Firebase admin variables:
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`
- OpenRouter variables:
  - `OPENROUTER_API_KEY`
  - `OPENROUTER_MODEL` (optional, defaults to `openai/gpt-4o-mini`)

Firebase Functions also reads `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, and
optionally `FUNCTIONS_REGION` from `functions/.env` during deployment or the
deployed function environment. Use `functions/.env.example` as the template.
Deploy
the durable extraction worker with:

```bash
pnpm --dir functions install
pnpm --dir functions deploy
```

## Install and Run

```bash
pnpm install
pnpm lint
pnpm dev
```

App runs at `http://localhost:3000`.

## Core User Flows

1. Open `/login` and sign in with Google.
2. Go to `/dashboard`, paste a passage, and submit it.
3. The passage is saved as pending immediately; extraction continues in the background.
4. Open vocabulary bank on dashboard for persisted, deduplicated words.
5. Open `/dashboard/history` for passage and vocabulary timeline views.
6. Open a saved passage detail page to expand paragraph-level Vietnamese translations, add or edit a translation manually, delete it, or generate/regenerate it with AI.
7. Select a word in the passage panel and use the popup actions to translate it to Vietnamese or generate a prefilled vocabulary draft.

## API Endpoints

- `POST /api/auth/session`: create session cookie from Firebase ID token.
- `DELETE /api/auth/session`: clear session cookie.
- `POST /api/extract`: save a pending passage and start background extraction.
- `POST /api/extract/process`: explicitly process a pending passage with the existing OpenRouter extractor for local/manual fallback use; Firebase Functions owns automatic production processing.
- `POST /api/extract/retry`: retry an owned failed extraction.
- `GET /api/vocabulary`: paginated vocabulary list with optional prefix filter.
- `POST /api/translations`: manually add or AI-generate one paragraph translation.
- `PUT /api/translations`: manually edit or AI-regenerate one paragraph translation.
- `DELETE /api/translations`: delete one paragraph translation.
- `POST /api/word-actions/translate`: translate a selected passage word to Vietnamese.
- `POST /api/word-actions/draft`: generate a prefilled vocabulary draft from a selected passage word.
- `GET /api/profile/history`: paginated combined passage and vocabulary history.

Passage records move through `pending`, `completed`, and `error` states. Failed
records retain their original passage and expose a Retry action on the detail page.

Protected routes require either:

- `Authorization: Bearer <firebase_id_token>`
- Session cookie set by `/api/auth/session`

The word-action routes use the same authenticated request pattern as the rest of the app.

Paragraph translations are stored with the owning passage. AI operations are
transactionally claimed per paragraph, and an expired claim can be reclaimed
without removing an existing translation. Translation-provider failures affect
only the paragraph being generated and do not clear vocabulary results.

## Linting

Run lint before finishing any task:

```bash
pnpm lint
```
