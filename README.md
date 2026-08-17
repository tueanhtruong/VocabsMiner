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
6. Open a saved passage detail page, select a word in the passage panel, and use the popup actions to translate it to Vietnamese or generate a prefilled vocabulary draft.

## API Endpoints

- `POST /api/auth/session`: create session cookie from Firebase ID token.
- `DELETE /api/auth/session`: clear session cookie.
- `POST /api/extract`: save a pending passage and start background extraction.
- `POST /api/extract/process`: internally process a pending passage with the existing OpenRouter extractor.
- `POST /api/extract/retry`: retry an owned failed extraction.
- `GET /api/vocabulary`: paginated vocabulary list with optional prefix filter.
- `POST /api/word-actions/translate`: translate a selected passage word to Vietnamese.
- `POST /api/word-actions/draft`: generate a prefilled vocabulary draft from a selected passage word.
- `GET /api/profile/history`: paginated combined passage and vocabulary history.

Passage records move through `pending`, `completed`, and `error` states. Failed
records retain their original passage and expose a Retry action on the detail page.

Protected routes require either:

- `Authorization: Bearer <firebase_id_token>`
- Session cookie set by `/api/auth/session`

The word-action routes use the same authenticated request pattern as the rest of the app.

## Linting

Run lint before finishing any task:

```bash
pnpm lint
```
