# Data Model: Retry Stale Pending Extraction

## Passage History Record

Stored at `users/{uid}/passages/{recordId}`.

| Field             | Type                            | Required    | Description                                                                                           |
| ----------------- | ------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------- |
| `recordId`        | string                          | yes         | Stable record identifier and document identifier.                                                     |
| `extractionId`    | string                          | yes         | Existing extraction identifier; equal to `recordId` for this flow.                                    |
| `uid`             | string                          | yes         | Immutable authenticated owner.                                                                        |
| `title`           | string                          | yes         | Saved passage title; unchanged by retry.                                                              |
| `passage`         | string                          | yes         | Saved source content; unchanged by retry.                                                             |
| `paragraphs`      | Stored paragraph array          | no          | Existing paragraph and translation state.                                                             |
| `vocabularyList`  | VocabularyItem[]                | yes         | Empty while pending/error; populated on completed extraction.                                         |
| `vocabularyCount` | number                          | yes         | Zero while pending/error; list length when completed.                                                 |
| `status`          | `pending \| completed \| error` | yes         | Current user-visible extraction state.                                                                |
| `pendingSince`    | Firestore Timestamp             | conditional | Start of the current pending lifecycle. Required for new pending records; removed on completed/error. |
| `errorReason`     | string or absent                | no          | Sanitized reason when status is `error`; removed when pending restarts.                               |
| `activeAttemptId` | string or absent                | no          | Internal worker claim token; removed on terminal completion/failure and never exposed.                |
| `createdAt`       | Firestore Timestamp             | yes         | Original submission time; unchanged by retries.                                                       |
| `updatedAt`       | Firestore Timestamp             | yes         | Last record update time.                                                                              |

### Legacy compatibility

For an existing pending record without `pendingSince`, the service may use a valid `createdAt` as its pending-start fallback. New writes must always include `pendingSince`. A record without a usable timestamp is not eligible for stale retry.

## Extraction Attempt

An extraction attempt is represented by the combination of a pending lifecycle and its worker claim:

- `pendingSince` identifies when the current pending lifecycle began.
- `activeAttemptId` identifies the worker currently allowed to finalize that lifecycle.
- A retry sets a new `pendingSince`, clears the old `activeAttemptId`, clears stale vocabulary/error fields, and causes the next trigger or explicit fallback dispatch to claim a new attempt.

## State Transitions

```text
new submission -> pending { pendingSince = now }
pending + successful provider response -> completed { remove pendingSince, activeAttemptId }
pending + provider/storage failure -> error { remove pendingSince, activeAttemptId }
error + authenticated retry -> pending { pendingSince = now }
pending older than 15 minutes + authenticated retry -> pending { pendingSince = now }
```

A retry from stale pending invalidates the previous claim by deleting `activeAttemptId`. Any older worker can only finalize when its token still matches, so its later result is ignored after the reset.

## Validation Rules

- Stale eligibility requires `status === "pending"` and elapsed time strictly greater than 15 minutes.
- Exactly 15 minutes elapsed is not eligible.
- `pendingSince` must be a valid Firestore timestamp; legacy `createdAt` fallback is allowed only when valid.
- Retry must resolve the passage under the authenticated user's `users/{uid}` path.
- Pending and error records expose an empty vocabulary list and zero count in the detail DTO.
- Terminal records do not expose `pendingSince`.
