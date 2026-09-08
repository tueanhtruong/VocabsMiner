# Stale Extraction Retry API Contract

All endpoints use the existing authenticated request convention and success/error envelope.

## Passage Detail

`GET /api/vocabulary?recordId={recordId}`

For a pending passage, the detail response includes the current pending lifecycle start:

```json
{
  "recordId": "uuid",
  "status": "pending",
  "pendingSince": "2026-09-08T12:00:00.000Z",
  "vocabularyList": [],
  "vocabularyCount": 0
}
```

`pendingSince` is omitted for `completed` and `error` records. Legacy pending records may return their valid `createdAt` as the compatibility value. Ownership and record-not-found behavior remain unchanged.

## Retry Extraction

`POST /api/extract/retry`

Request:

```json
{
  "recordId": "uuid"
}
```

Success for an error record or an eligible stale pending record:

```json
{
  "recordId": "uuid",
  "status": "pending",
  "pendingSince": "2026-09-08T12:16:00.000Z"
}
```

The operation is allowed only for the authenticated owner. The service transaction must:

1. Read the current owner-scoped record.
2. Accept `error` using the existing retry behavior, or accept `pending` only when more than 15 minutes have elapsed since its current pending start.
3. Clear `vocabularyList`, `vocabularyCount`, `errorReason`, and the previous `activeAttemptId`.
4. Set `status` to `pending`, `pendingSince` to the transaction's current timestamp, and update `updatedAt`.

A pending record at or below the threshold, a completed record, or a pending record without a usable timestamp returns `400 RETRY_NOT_AVAILABLE`. A missing record returns `404 NOT_FOUND`; missing authentication returns `401 UNAUTHORIZED`; malformed input returns `400 INVALID_INPUT`.

The route dispatches extraction only after the transaction accepts the reset. Concurrent retries are serialized by Firestore; only the first eligible request can reset the stale lifecycle, and later requests observe the fresh pending timestamp and are rejected.

## Background Processing Contract

The existing Firebase Functions trigger and explicit local/manual fallback continue to process pending records:

1. Claim only an unclaimed pending record and preserve or backfill `pendingSince`.
2. Run server-side vocabulary extraction.
3. Finalize only when `activeAttemptId` still matches the claim token.
4. On success, write vocabulary and completed state, then remove `pendingSince`, `activeAttemptId`, and `errorReason`.
5. On failure, write sanitized error state and zero vocabulary, then remove `pendingSince` and `activeAttemptId`.

A worker from the invalidated pre-retry attempt must not overwrite the fresh retry attempt.
