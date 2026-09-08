# Paragraph Translation API Contract

All endpoints require the existing authenticated request convention and use the existing `{ error: { code, message } }` error envelope. The authenticated user's passage is resolved at `users/{uid}/passages/{recordId}`; a caller cannot supply an alternative owner.

## Existing Passage Detail Extension

`GET /api/vocabulary?recordId={recordId}` continues to return the existing passage detail fields and adds:

```json
{
  "paragraphs": [
    {
      "paragraphId": "p-0-<source-hash>",
      "index": 0,
      "sourceText": "First paragraph.",
      "translation": "Đoạn văn đầu tiên.",
      "translationState": "available",
      "translationUpdatedAt": "2026-09-03T12:00:00.000Z"
    }
  ]
}
```

`translation` and `translationUpdatedAt` are omitted when absent. `translationError` is included only for a failed or retryable paragraph. Internal operation claim IDs are never returned.

## Add or Generate

`POST /api/translations`

Manual add:

```json
{
  "recordId": "record-123",
  "paragraphId": "p-0-<source-hash>",
  "mode": "manual",
  "translation": "Đoạn văn đầu tiên."
}
```

AI generation:

```json
{
  "recordId": "record-123",
  "paragraphId": "p-0-<source-hash>",
  "mode": "ai"
}
```

Success returns `200` with `{ "recordId": string, "paragraph": PublicPassageParagraph }`. AI mode does not return until the selected paragraph is available or the request fails. The UI may show local progress while waiting.

## Edit or Regenerate

`PUT /api/translations`

Manual edit uses `mode: "manual"` and includes `translation`. Regeneration uses `mode: "ai"` and omits `translation`. The response shape matches POST.

A failed regeneration returns a non-success API error while preserving the previous saved translation in Firestore. The detail query can be refreshed to show the paragraph error state.

## Delete

`DELETE /api/translations`

```json
{
  "recordId": "record-123",
  "paragraphId": "p-0-<source-hash>"
}
```

Success returns `200` with `{ "recordId": string, "paragraph": PublicPassageParagraph }`, where the paragraph is in the `missing` state without a translation.

## Error Cases

- `401 UNAUTHORIZED`: authentication is missing or invalid.
- `400 INVALID_INPUT`: missing identifiers, unsupported mode, unknown paragraph, or blank manual translation.
- `404 NOT_FOUND`: passage does not exist for the authenticated user.
- `409 TRANSLATION_IN_PROGRESS`: another operation currently owns the selected paragraph.
- `502 TRANSLATION_PROVIDER_ERROR`: AI provider unavailable, rate limited after retries, or returned invalid content; an existing translation remains intact.
- `500 INTERNAL_ERROR`: unexpected storage or server failure.
