# Background Extraction API Contract

All endpoints use the existing authenticated request convention and return the existing success/error envelope.

## Create Pending Extraction

`POST /api/extract`

Request:

```json
{
  "title": "Climate policy",
  "passage": "..."
}
```

Success returns immediately after the pending record is saved:

```json
{
  "recordId": "uuid",
  "title": "Climate policy",
  "passage": "...",
  "status": "pending",
  "vocabularyList": [],
  "resultCount": 0,
  "saved": true,
  "createdAt": "2026-08-17T12:00:00.000Z"
}
```

Invalid title/passage returns `400 INVALID_INPUT`. The endpoint must not return provider errors for work that has already been accepted; provider failures are recorded asynchronously on the passage.

## Read Passage Detail and Status

`GET /api/vocabulary?recordId={recordId}`

The existing detail response adds:

```json
{
  "status": "pending | completed | error",
  "errorReason": "Extraction provider is currently unavailable"
}
```

`errorReason` is omitted unless status is `error`. Pending records return an empty `vocabularyList` and zero count. A missing record remains `404 NOT_FOUND`.

## Retry Extraction

`POST /api/extract/retry`

Request:

```json
{
  "recordId": "uuid"
}
```

Success:

```json
{
  "recordId": "uuid",
  "status": "pending"
}
```

The operation is allowed only for the authenticated owner. It resets an `error` record to pending and clears stale result/error fields. Retrying a currently pending record is idempotent and must not create duplicate active work. Missing records return `404 NOT_FOUND`; invalid requests return `400 INVALID_INPUT`.

## History List

`GET /api/profile/history`

Each passage item adds `status` and, when applicable, a sanitized `errorReason`. Pending and error items report `vocabularyCount: 0` and remain linkable to their detail view.

## Background Worker Contract

The Firebase Functions worker is triggered by a passage create/update where the current record has `status: "pending"`. It must:

1. Transactionally claim an unclaimed pending record with a unique `activeAttemptId`.
2. Run the existing server-side vocabulary extraction against the saved passage.
3. Finalize only if its claim token still matches.
4. On success, write normalized vocabulary, count, `completed`, updated timestamp, and clear claim/error fields.
5. On failure, write `error`, a sanitized reason, zero count/list, updated timestamp, and clear the claim.
