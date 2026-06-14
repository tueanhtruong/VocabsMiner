# Research: AI Vocabulary Extraction — Technical Decisions

**Feature**: 001-vocab-extraction | **Date**: 2026-06-12

All NEEDS CLARIFICATION items from the Technical Context have been resolved below.

---

## 1. AI Provider & Model Selection

**Decision**: OpenAI `gpt-4o-mini` via the official `openai` npm SDK (v4)

**Rationale**:
- `gpt-4o-mini` delivers excellent structured extraction quality at roughly 1/20th the
  cost of `gpt-4o` (≈$0.00015 per typical request vs $0.003).
- For a feature extracting 5–20 vocabulary items from a 50–2,000 word passage the model
  is more than capable; there is no benefit to a more powerful model for this task.
- The official `openai` SDK is preferred over Vercel AI SDK (`@ai-sdk/openai`) because
  it provides direct access to `response_format: { type: "json_object" }` without
  additional abstraction, ships TypeScript types out of the box, and has no extra
  dependencies.
- Alternative (`gpt-4o`) rejected because cost is prohibitive at scale for a learning
  app. Alternative (Vercel AI SDK) rejected because it adds an unnecessary layer for a
  non-streaming, structured-output use case.

**Estimated monthly cost at 1,000 extractions**: ~$0.15

---

## 2. Structured JSON Output from OpenAI

**Decision**: `response_format: { type: "json_object" }` with an explicit schema
description in the system prompt.

**Rationale**:
- Guarantees the API returns parseable JSON — no regex extraction or lenient parsing
  needed.
- The system prompt describes the exact output shape (`items` array with five fields per
  item), ensuring the model populates all required fields.
- Function-calling / tool-calling is a valid alternative but adds complexity (schema
  definition, tool metadata) for a fixed, non-interactive output shape.
- JSON Schema mode (`response_format: { type: "json_schema" }`, available in newer
  OpenAI releases) was considered but `json_object` is sufficient and available in all
  SDK v4 versions without additional schema boilerplate.

**System prompt skeleton**:
```
You are an academic vocabulary extraction specialist for IELTS preparation.
Given a reading passage, extract between 5 and 20 high-impact academic vocabulary items
most relevant to IELTS Band 7+ level. Avoid everyday words (the, is, have, go, etc.).

Return ONLY valid JSON in this exact shape:
{
  "items": [
    {
      "word": "<word as it appears>",
      "partOfSpeech": "<noun|verb|adjective|adverb|other>",
      "definition": "<plain English definition, ≤ 30 words>",
      "contextSentence": "<exact sentence from the passage containing the word>",
      "bandRelevance": "<B7|B8|B9>"
    }
  ]
}

If the passage contains no Band 7+ vocabulary, return { "items": [] }.
```

---

## 3. Firebase Architecture in Next.js App Router

**Decision**: Firebase JS SDK (client-side only) — no Firebase Admin SDK.

**Rationale**:
- All auth state is managed client-side via `onAuthStateChanged`, shared through a React
  Context provider. This is the established pattern for Firebase in Next.js when no
  server-side session cookie is required.
- Firebase Admin SDK would be needed only for server-side auth verification (e.g.,
  reading Firestore in RSC or Route Handlers with user identity). Given that:
  (a) the extraction endpoint (`/api/extract`) does not touch Firestore, and
  (b) the Goldmine page fetches data client-side using the client SDK,
  the Admin SDK is not needed in v1 (YAGNI).
- Pitfall avoided: Firebase client SDK must not be imported in React Server Components
  because it references `window`. It is safely imported only in `"use client"` files and
  in `lib/firebase/client.ts` (which is only imported by client-side code).

**Firebase init singleton pattern** (`lib/firebase/client.ts`):
```typescript
import { initializeApp, getApps } from "firebase/app";
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
```
The `getApps().length === 0` guard prevents "Firebase: Firebase App named '[DEFAULT]'
already exists" errors during Next.js hot module replacement.

---

## 4. Firestore Data Path & Deduplication Strategy

**Decision**: `users/{uid}/savedVocab/{wordKey}` where `wordKey = word.toLowerCase().trim()`

**Rationale**:
- Using the normalised word as the document ID makes `setDoc` naturally idempotent —
  saving "ubiquitous" twice overwrites the first with the same data. No extra read is
  needed to check for duplicates (FR-007 satisfied for free).
- Subcollection under `users/{uid}/` ensures Firestore security rules can be written as
  a single path match: `match /users/{userId}/savedVocab/{vocabId}` with
  `request.auth.uid == userId`.
- Alternative (top-level `savedVocab` collection with userId field) rejected because it
  requires compound queries + composite index and makes security rules more complex.

---

## 5. Auth State in React / Next.js App Router

**Decision**: `AuthContext` in `lib/auth/context.tsx` + `<AuthProvider>` in
`app/providers.tsx`, mounted as a Client Component child of the RSC root layout.

**Rationale**:
- RSC layouts cannot hold React state; the Auth context must be a Client Component.
- The standard Next.js pattern is a `providers.tsx` file marked `"use client"` that
  wraps `{children}`, allowing the layout itself to remain a Server Component.
- `onAuthStateChanged` is called once in a `useEffect` in `AuthProvider`, keeping a
  single subscription alive for the lifetime of the app.
- Zustand / Redux rejected per constitution Principle IV. `useContext` + a single context
  is the minimal viable approach.

---

## 6. Environment Variables

| Variable | Side | Purpose |
|----------|------|---------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Client | Firebase project API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Client | Firebase Auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Client | Firestore project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Client | Firebase Storage (not used in v1) |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Client | Firebase FCM (not used in v1) |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Client | Firebase App ID |
| `OPENAI_API_KEY` | Server only | OpenAI API key — never exposed to browser |

`NEXT_PUBLIC_*` variables are safe to be bundled into the browser; the Firebase JS SDK
config is designed to be public (security is enforced by Firestore security rules and
Firebase Auth, not by keeping the config secret).

`OPENAI_API_KEY` has no `NEXT_PUBLIC_` prefix — Next.js will never expose it to the
client bundle. It is only accessed inside `app/api/extract/route.ts`.

---

## 7. Word Count Validation Strategy

**Decision**: Client-side pre-validation + server-side re-validation.

**Rationale**:
- Word count is estimated client-side (`passage.trim().split(/\s+/).length`) to provide
  instant feedback in the UI (FR-004 / FR-013) before any network request is made.
- The Route Handler re-validates independently (security-in-depth) to prevent bypassing
  via direct API calls.
- 50-word minimum check: reject with 400 + `"Passage must be at least 50 words for
  meaningful extraction."`.
- 2,000-word maximum check: reject with 400 + `"Passage exceeds the 2,000-word limit.
  Please shorten your passage and try again."`.
