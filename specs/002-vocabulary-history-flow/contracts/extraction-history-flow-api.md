# Interface Contract: Vocabulary Extraction & History Flow

## Scope

This contract defines the interfaces used by the dashboard extraction flow, detail page loading/highlighting inputs, and passage-history sidebar navigation.

All endpoints are same-origin Next.js route handlers and require authenticated user context where data access is user-scoped.

## Endpoint: Extract And Save Passage Vocabulary

- Method: POST
- Path: /api/extract
- Auth: Required

### Request Body

```json
{
  "title": "string",
  "passage": "string"
}
```

### Validation Rules

- title is required and must be non-empty after trim
- passage is required and must be non-empty after trim

### Success Response (200)

```json
{
  "recordId": "string",
  "title": "string",
  "passage": "string",
  "vocabularyList": [
    {
      "word": "string",
      "definition": "string",
      "context": "string"
    }
  ],
  "saved": true,
  "createdAt": "ISO-8601 timestamp"
}
```

### Error Responses

- 400 INVALID_INPUT
- 401 UNAUTHORIZED
- 502 EXTRACTION_PROVIDER_ERROR
- 500 STORAGE_FAILURE

## Endpoint: List Passage History

- Method: GET
- Path: /api/profile/history
- Auth: Required

### Query Parameters

- limit (optional integer, default 20, max 50)
- cursor (optional string)

### Success Response (200)

```json
{
  "items": [
    {
      "recordId": "string",
      "title": "string",
      "createdAt": "ISO-8601 timestamp",
      "vocabularyCount": 0
    }
  ],
  "nextCursor": "string or null"
}
```

### Error Responses

- 401 UNAUTHORIZED
- 400 INVALID_CURSOR
- 500 HISTORY_LOAD_FAILURE

## Endpoint: Get Passage Detail

- Method: GET
- Path: /api/vocabulary
- Auth: Required

### Query Parameters

- recordId (required string)

### Success Response (200)

```json
{
  "recordId": "string",
  "title": "string",
  "passage": "string",
  "vocabularyList": [
    {
      "word": "string",
      "definition": "string",
      "context": "string"
    }
  ]
}
```

### Error Responses

- 400 INVALID_RECORD_ID
- 401 UNAUTHORIZED
- 404 RECORD_NOT_FOUND
- 500 DETAIL_LOAD_FAILURE

## UI Interaction Contract: Detail Highlight Mapping

- Input: selected vocabulary word from right panel list
- Output:
  - highlightedRanges in passage text for matching terms
  - hasMatch false triggers no-match feedback state

### Matching Rules

- Case-insensitive word comparison
- Preserve exact passage text rendering
- Repeated matches may all be highlighted

## Cross-Endpoint Guarantees

- All reads/writes are restricted to authenticated user-owned records
- Successful extraction response includes persisted recordId for deterministic detail navigation
- History selections resolve to the same record detail payload used in detail page rendering
