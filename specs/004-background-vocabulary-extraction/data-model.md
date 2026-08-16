# Data Model: Background Vocabulary Extraction

## Passage History Record

Stored at `users/{uid}/passages/{recordId}`.

| Field             | Type                            | Required | Description                                                                               |
| ----------------- | ------------------------------- | -------- | ----------------------------------------------------------------------------------------- |
| `recordId`        | string                          | yes      | Stable record identifier and document identifier.                                         |
| `extractionId`    | string                          | yes      | Existing extraction identifier; equal to `recordId` for this flow.                        |
| `uid`             | string                          | yes      | Owning authenticated user. Immutable after creation.                                      |
| `title`           | string                          | yes      | User-provided normalized title.                                                           |
| `passage`         | string                          | yes      | User-provided normalized passage content.                                                 |
| `previewText`     | string                          | yes      | Derived history preview.                                                                  |
| `passageHash`     | string                          | yes      | Existing content hash.                                                                    |
| `vocabularyList`  | VocabularyItem[]                | yes      | Empty while pending/error; populated on completed extraction.                             |
| `vocabularyCount` | number                          | yes      | Length of the stored vocabulary list; zero while pending/error.                           |
| `status`          | `pending \| completed \| error` | yes      | Current user-facing extraction state.                                                     |
| `errorReason`     | string or absent                | no       | Sanitized reason when status is `error`; removed on retry.                                |
| `activeAttemptId` | string or absent                | no       | Internal worker claim token; removed after completion/error and never exposed to clients. |
| `createdAt`       | Firestore Timestamp             | yes      | Submission time; unchanged by retries.                                                    |
| `updatedAt`       | Firestore Timestamp             | yes      | Last status or content update time.                                                       |

## Vocabulary Item

The existing five-field vocabulary shape remains unchanged: `word`, `type`, `phonetic`, `definition`, and `vietnamese`. Extraction writes a normalized list on success. Manual vocabulary edits continue to update the same passage document and must not be overwritten by a worker after its attempt claim has been finalized.

## State Transitions

```text
new submission -> pending
pending + successful provider response -> completed
pending + provider/storage failure -> error
error + authenticated Retry -> pending
```

Retry clears `vocabularyList`, `vocabularyCount`, and `errorReason`, preserves title/content/`createdAt`, clears the previous claim, and creates a new triggerable pending transition. A worker may finalize a record only if its claim token still matches `activeAttemptId`.

## Validation and Ownership

- Title and passage must pass the existing extraction request parser before record creation.
- `uid` is taken from the authenticated server identity and must remain immutable.
- API reads and retry mutations resolve the document beneath the authenticated user's `users/{uid}` path.
- `status` values outside the three defined states are invalid for user-facing API responses.
- `vocabularyCount` must equal the stored list length for completed results and must be zero for pending/error records.
