# API Contract: Vocabulary Extraction Endpoint

**Feature**: 001-vocab-extraction | **Date**: 2026-06-12

---

## POST /api/extract

Accepts a reading passage and returns a structured list of high-impact academic
vocabulary items extracted by the AI service. This endpoint is publicly accessible —
no authentication is required.

---

### Request

**Method**: `POST`  
**Path**: `/api/extract`  
**Content-Type**: `application/json`

#### Request Body

```json
{
  "passage": "<string>"
}
```

| Field     | Type     | Required | Constraints                   |
| --------- | -------- | -------- | ----------------------------- |
| `passage` | `string` | ✅       | Min 50 words, max 2,000 words |

---

### Success Response — `200 OK`

Returns a list of extracted vocabulary items. The `items` array may be empty if the
passage contains no Band 7+ vocabulary.

```json
{
  "items": [
    {
      "word": "ubiquitous",
      "partOfSpeech": "adjective",
      "definition": "Present, appearing, or found everywhere.",
      "contextSentence": "The ubiquitous smartphone has become an indispensable tool for modern communication.",
      "bandRelevance": "B8"
    },
    {
      "word": "indispensable",
      "partOfSpeech": "adjective",
      "definition": "Absolutely necessary; impossible to do without.",
      "contextSentence": "The ubiquitous smartphone has become an indispensable tool for modern communication.",
      "bandRelevance": "B7"
    }
  ]
}
```

#### Response Body Schema

| Field   | Type          | Description                                                    |
| ------- | ------------- | -------------------------------------------------------------- |
| `items` | `VocabItem[]` | 0–20 vocabulary items; empty array = no Band 7+ vocab detected |

#### VocabItem Schema

| Field             | Type     | Values                                         | Description                                             |
| ----------------- | -------- | ---------------------------------------------- | ------------------------------------------------------- |
| `word`            | `string` | —                                              | The word as it appears in the passage                   |
| `partOfSpeech`    | `string` | `noun`, `verb`, `adjective`, `adverb`, `other` | Grammatical category                                    |
| `definition`      | `string` | —                                              | Plain-English definition, ≤ 30 words                    |
| `contextSentence` | `string` | —                                              | The exact sentence from the passage containing the word |
| `bandRelevance`   | `string` | `B7`, `B8`, `B9`                               | IELTS band relevance label                              |

---

### Error Responses

#### `400 Bad Request` — Passage too short

Returned when the passage contains fewer than 50 words.

```json
{
  "error": "Passage must be at least 50 words for meaningful extraction."
}
```

#### `400 Bad Request` — Passage too long

Returned when the passage exceeds 2,000 words.

```json
{
  "error": "Passage exceeds the 2,000-word limit. Please shorten your passage and try again."
}
```

#### `400 Bad Request` — Missing or invalid body

Returned when the request body is missing, malformed, or the `passage` field is absent
or not a string.

```json
{
  "error": "Request body must be JSON with a \"passage\" string field."
}
```

#### `503 Service Unavailable` — AI service unavailable

Returned when the OpenAI API is unreachable, returns an unexpected error, or the
response cannot be parsed as valid JSON.

```json
{
  "error": "The AI service is currently unavailable. Please try again shortly."
}
```

#### `500 Internal Server Error` — Unexpected failure

```json
{
  "error": "An unexpected error occurred. Please try again."
}
```

---

### Notes

- The endpoint does not persist any data; it is stateless.
- The `passage` is sent server-side to the OpenAI API; it is never stored.
- Callers should preserve the submitted passage text on error so the user can retry
  without re-typing (FR-005).
- Response times may be up to 10 seconds for long passages (SC-001).
- Rate limiting by the OpenAI API may result in transient `503` responses during
  high-load periods; clients should display a user-friendly retry message.

---

### TypeScript Client Usage

```typescript
// Calling from a Client Component
const response = await fetch("/api/extract", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ passage }),
});

if (!response.ok) {
  const { error } = (await response.json()) as { error: string };
  // Display error; DO NOT clear the passage text
  return;
}

const { items } = (await response.json()) as { items: VocabItem[] };
// Render items
```
