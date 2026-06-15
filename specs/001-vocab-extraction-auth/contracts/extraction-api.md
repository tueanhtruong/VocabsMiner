# Interface Contract: Vocab Extraction Authentication API

## Scope

This contract defines the external application interfaces consumed by the web client for:

- Authentication-gated extraction
- Profile history retrieval
- User-scoped vocabulary persistence

All endpoints are same-origin Next.js route handlers. Authentication uses Firebase ID token from Google-authenticated session.

## Authentication Contract

- Required header for protected endpoints:
  - `Authorization: Bearer <firebase_id_token>`
- Token requirements:
  - Must be valid and unexpired
  - UID from token is the ownership key for all data access
- Unauthorized response:
  - HTTP `401`
  - Body: `{ "error": { "code": "UNAUTHORIZED", "message": "Authentication required" } }`

## Endpoint: Extract Vocabulary

- Method: `POST`
- Path: `/api/extract`
- Auth: Required

### Request Body

```json
{
  "passage": "string"
}
```

### Request Validation

- `passage` is required
- `passage` must be non-empty after trimming
- `passage` length must not exceed configured maximum

### Success Response (200)

```json
{
  "extractionId": "string",
  "vocabulary": [
    {
      "word": "string",
      "definition": "string",
      "context": "string"
    }
  ],
  "resultCount": 0,
  "saved": true,
  "createdAt": "ISO-8601 timestamp"
}
```

### No-Results Response (200)

```json
{
  "extractionId": "string",
  "vocabulary": [],
  "resultCount": 0,
  "saved": true,
  "createdAt": "ISO-8601 timestamp"
}
```

### Error Responses

- `400 INVALID_INPUT`
- `401 UNAUTHORIZED`
- `429 RATE_LIMITED`
- `502 EXTRACTION_PROVIDER_ERROR`
- `500 STORAGE_FAILURE`

Error body shape:

```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Human-readable message"
  }
}
```

## Endpoint: Get Profile History

- Method: `GET`
- Path: `/api/profile/history`
- Auth: Required

### Query Parameters

- `passagesLimit` (optional integer, default 20, max 50)
- `vocabularyLimit` (optional integer, default 20, max 50)
- `passagesCursor` (optional string)
- `vocabularyCursor` (optional string)

### Success Response (200)

```json
{
  "uid": "string",
  "passages": [
    {
      "passageId": "string",
      "previewText": "string",
      "createdAt": "ISO-8601 timestamp",
      "vocabularyCount": 0
    }
  ],
  "vocabulary": [
    {
      "vocabularyId": "string",
      "word": "string",
      "definition": "string",
      "lastSeenAt": "ISO-8601 timestamp",
      "occurrenceCount": 0
    }
  ],
  "next": {
    "passagesCursor": "string or null",
    "vocabularyCursor": "string or null"
  }
}
```

### Error Responses

- `401 UNAUTHORIZED`
- `400 INVALID_CURSOR`
- `500 PROFILE_HISTORY_FAILURE`

## Endpoint: Get Vocabulary Collection

- Method: `GET`
- Path: `/api/vocabulary`
- Auth: Required

### Query Parameters

- `limit` (optional integer, default 20, max 100)
- `cursor` (optional string)
- `q` (optional string for case-insensitive prefix filtering)

### Success Response (200)

```json
{
  "uid": "string",
  "items": [
    {
      "vocabularyId": "string",
      "word": "string",
      "definition": "string",
      "context": "string",
      "firstSeenAt": "ISO-8601 timestamp",
      "lastSeenAt": "ISO-8601 timestamp",
      "occurrenceCount": 0
    }
  ],
  "nextCursor": "string or null"
}
```

## Cross-Endpoint Contract Guarantees

- Every successful record returned belongs to authenticated UID only.
- Duplicate vocabulary submissions update existing entries instead of creating duplicates.
- Profile history includes both reading passages and vocabulary history.
- Responses remain stable for fields defined above across v1 changes.
