# Data Model: AI Vocabulary Extraction

**Feature**: 001-vocab-extraction | **Date**: 2026-06-12

---

## Entities

### 1. VocabItem _(transient — not persisted)_

Represents a single vocabulary item returned by the AI extraction. Lives only in memory
(React state) for the duration of the extraction session.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `word` | `string` | ✅ | The vocabulary word as it appears in the passage |
| `partOfSpeech` | `"noun" \| "verb" \| "adjective" \| "adverb" \| "other"` | ✅ | Grammatical category |
| `definition` | `string` | ✅ | Plain-English definition, ≤ 30 words |
| `contextSentence` | `string` | ✅ | The exact sentence from the passage where the word appears |
| `bandRelevance` | `"B7" \| "B8" \| "B9"` | ✅ | IELTS band level relevance label |

**TypeScript interface** (`types/vocab.ts`):
```typescript
export interface VocabItem {
  word: string;
  partOfSpeech: "noun" | "verb" | "adjective" | "adverb" | "other";
  definition: string;
  contextSentence: string;
  bandRelevance: "B7" | "B8" | "B9";
}
```

**Validation rules**:
- `word`: non-empty string
- `definition`: non-empty, ideally ≤ 30 words (enforced by prompt, not validated server-side)
- `contextSentence`: must be a substring of the submitted passage (verified by the AI prompt instruction)
- AI returns 5–20 items for a valid passage; 0 items is valid when no Band 7+ vocab is detected

---

### 2. SavedVocabEntry _(persisted — Firestore)_

A `VocabItem` saved to a user's personal collection. Extends `VocabItem` with
persistence metadata.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | ✅ | Firestore document ID = `word.toLowerCase().trim()` |
| `userId` | `string` | ✅ | Firebase Auth UID of the owner |
| `savedAt` | `Timestamp` | ✅ | Firestore server timestamp set on write |
| `word` | `string` | ✅ | (inherited from VocabItem) |
| `partOfSpeech` | `string` | ✅ | (inherited from VocabItem) |
| `definition` | `string` | ✅ | (inherited from VocabItem) |
| `contextSentence` | `string` | ✅ | (inherited from VocabItem) |
| `bandRelevance` | `string` | ✅ | (inherited from VocabItem) |

**TypeScript interface** (`types/vocab.ts`):
```typescript
import { Timestamp } from "firebase/firestore";

export interface SavedVocabEntry extends VocabItem {
  id: string;
  userId: string;
  savedAt: Timestamp;
}
```

**Firestore path**: `users/{userId}/savedVocab/{word.toLowerCase().trim()}`

**Deduplication**: The document ID is the normalised word. Writing the same word twice
(`setDoc` with merge: false) overwrites the entry — effectively a no-op for duplicate
saves since the data is identical. This satisfies FR-007 without an extra read.

---

### 3. User _(managed by Firebase Auth — not stored in Firestore directly)_

The authenticated learner. Identity is provided by Firebase Auth; no custom Firestore
`users` collection document is created in v1 (YAGNI — the subcollection path
`users/{uid}/savedVocab` is sufficient to scope data without a parent document).

| Field | Source | Description |
|-------|--------|-------------|
| `uid` | Firebase Auth | Unique user ID (used as Firestore path segment) |
| `email` | Firebase Auth | User's email address |
| `displayName` | Firebase Auth | Optional display name (may be null for email/password auth) |

---

### 4. Passage _(transient — not persisted)_

A block of user-supplied text submitted for extraction. Exists only as a React state
string in `PassageInput`.

| Field | Type | Constraint |
|-------|------|------------|
| `text` | `string` | min 50 words, max 2,000 words, English only |

**Validation** (client + server):
- `< 50 words` → error: "Passage must be at least 50 words for meaningful extraction."
- `> 2,000 words` → error: "Passage exceeds the 2,000-word limit. Please shorten your
  passage and try again."

---

## Firestore Schema

```
Firestore
└── users/                           ← implicit collection (no top-level document needed)
    └── {uid}/
        └── savedVocab/              ← subcollection
            └── {wordKey}/           ← document ID = word.toLowerCase().trim()
                ├── word:            string
                ├── partOfSpeech:    string
                ├── definition:      string
                ├── contextSentence: string
                ├── bandRelevance:   string
                ├── userId:          string
                └── savedAt:         Timestamp
```

---

## State Transitions

### VocabItem → SavedVocabEntry

```
[VocabItem in extraction result]
         │
         │ user clicks "Save" (authenticated)
         ▼
[saveVocabItem(uid, item)] ──→ Firestore write
         │
         ▼
[SavedVocabEntry in user's goldmine]
         │
         │ user clicks "Remove"
         ▼
[removeVocabItem(uid, word)] ──→ Firestore delete
         │
         ▼
[Entry removed from goldmine]
```

### Auth State

```
[Unauthenticated visitor]
         │
         │ register / sign-in
         ▼
[Authenticated user] ──── can save, view goldmine
         │
         │ sign-out
         ▼
[Unauthenticated visitor] ──── can still extract
```
