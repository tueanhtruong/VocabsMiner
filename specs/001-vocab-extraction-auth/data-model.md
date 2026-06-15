# Data Model: Vocab Extraction Authentication

## Entity: LearnerAccount

- Purpose: Represents authenticated Google identity used to enter the application.
- Primary Key: `uid` (Firebase Auth UID)
- Fields:
  - `uid` (string, required, immutable)
  - `email` (string, required)
  - `displayName` (string, optional)
  - `photoURL` (string, optional)
  - `provider` (string, required, fixed to `google.com`)
  - `createdAt` (timestamp, required)
  - `lastLoginAt` (timestamp, required)
- Relationships:
  - 1:1 with LearnerProfile
  - 1:N with ExtractionRequest
  - 1:N with VocabularyItem (through VocabularyCollection)

## Entity: LearnerProfile

- Purpose: User-owned profile metadata and counters for personalized experience.
- Primary Key: `uid`
- Fields:
  - `uid` (string, required, immutable)
  - `preferredTarget` (string, optional, default `Band 6+`)
  - `totalPassages` (number, required, default 0)
  - `totalVocabularySaved` (number, required, default 0)
  - `updatedAt` (timestamp, required)
- Validation Rules:
  - `uid` must exactly match authenticated `request.auth.uid`
  - Counter fields must be non-negative integers

## Entity: ExtractionRequest

- Purpose: Tracks one submitted reading passage and extraction processing output.
- Primary Key: `extractionId`
- Ownership Key: `uid`
- Fields:
  - `extractionId` (string, required)
  - `uid` (string, required, immutable)
  - `passageText` (string, required)
  - `passageHash` (string, required)
  - `status` (enum: `queued`, `processing`, `completed`, `failed`, required)
  - `resultCount` (number, required, default 0)
  - `createdAt` (timestamp, required)
  - `completedAt` (timestamp, optional)
  - `errorCode` (string, optional)
- Validation Rules:
  - `passageText` must not be empty after trim
  - `passageText` length must remain within configured extraction input limit
  - `status=completed` requires `completedAt`
- State Transitions:
  - `queued -> processing -> completed`
  - `queued -> processing -> failed`

## Entity: VocabularyItem

- Purpose: Canonical stored vocabulary record for a learner.
- Primary Key: `vocabularyId` (normalized word key per user)
- Ownership Key: `uid`
- Fields:
  - `vocabularyId` (string, required)
  - `uid` (string, required, immutable)
  - `word` (string, required)
  - `normalizedWord` (string, required)
  - `definition` (string, required)
  - `contextSnippet` (string, required)
  - `firstSeenAt` (timestamp, required)
  - `lastSeenAt` (timestamp, required)
  - `occurrenceCount` (number, required, default 1)
  - `passageRefs` (array of extraction IDs, required)
- Validation Rules:
  - `word`, `definition`, and `contextSnippet` are non-empty
  - `normalizedWord` is lowercase trimmed canonical form
  - `occurrenceCount` must be >= 1

## Entity: ReadingPassageHistory

- Purpose: User-visible chronological history of submitted passages.
- Primary Key: `passageId` (or reuse `extractionId`)
- Ownership Key: `uid`
- Fields:
  - `passageId` (string, required)
  - `uid` (string, required, immutable)
  - `previewText` (string, required)
  - `fullTextRef` (string, optional, if split storage is used)
  - `createdAt` (timestamp, required)
  - `vocabularyCount` (number, required)
- Validation Rules:
  - `previewText` must be derived from submitted passage and not empty
  - `vocabularyCount` must be >= 0

## Entity: VocabularyCollectionView

- Purpose: Read model for profile history screen combining vocabulary and passage records.
- Primary Key: Derived query view, not persisted as independent source-of-truth entity.
- Fields:
  - `uid`
  - `recentPassages[]`
  - `recentVocabulary[]`
  - `generatedAt`
- Validation Rules:
  - Data must only include records where `record.uid == current uid`

## Relationship Summary

- `LearnerAccount (1) -> LearnerProfile (1)`
- `LearnerAccount (1) -> ExtractionRequest (N)`
- `ExtractionRequest (1) -> VocabularyItem (N)` via extraction output mapping
- `LearnerAccount (1) -> ReadingPassageHistory (N)`
- `LearnerAccount (1) -> VocabularyItem (N)`

## Firestore Collection Layout (Planned)

- `users/{uid}`: LearnerProfile metadata
- `users/{uid}/passages/{passageId}`: ReadingPassageHistory / ExtractionRequest summary
- `users/{uid}/vocabulary/{vocabularyId}`: VocabularyItem records

## Data Integrity Rules

- All writes require authenticated user and UID path match.
- Profile, passage, and vocabulary writes for one extraction should commit atomically when feasible.
- Duplicate words update existing `VocabularyItem` instead of creating new duplicates.
