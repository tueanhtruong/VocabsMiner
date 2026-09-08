# Data Model: Paragraph-Level Vietnamese Translation & Management

## Passage Paragraph

Stored as an ordered entry in `users/{uid}/passages/{recordId}.paragraphs`.

| Field                           | Type                                          | Required    | Description                                                                     |
| ------------------------------- | --------------------------------------------- | ----------- | ------------------------------------------------------------------------------- |
| `paragraphId`                   | string                                        | yes         | Deterministic identifier for the normalized source paragraph.                   |
| `index`                         | number                                        | yes         | Zero-based display order within the passage.                                    |
| `sourceText`                    | string                                        | yes         | Trimmed, non-empty paragraph text used for display and AI input.                |
| `translation`                   | string or absent                              | no          | Saved Vietnamese translation. Absent when no translation exists.                |
| `translationState`              | `missing \| available \| generating \| error` | yes         | Current per-paragraph translation state.                                        |
| `translationError`              | string or absent                              | no          | Sanitized, actionable error for the last failed AI operation.                   |
| `translationUpdatedAt`          | Firestore Timestamp or absent                 | no          | Last successful manual or AI translation update.                                |
| `translationOperationId`        | string or absent                              | server-only | Claim token for an in-flight AI operation; never returned to clients.           |
| `translationOperationStartedAt` | Firestore Timestamp or absent                 | server-only | Start time for the current AI claim; never returned to clients.                 |
| `translationOperationExpiresAt` | Firestore Timestamp or absent                 | server-only | Lease expiry for reclaiming an abandoned AI claim; never returned to clients.   |
| `sourceHash`                    | string                                        | yes         | Hash of normalized `sourceText`, used to make paragraph identity deterministic. |

`paragraphs` is required for newly created records. Legacy records without it are projected using the normalization rule in `research.md` and persisted when the record is next read or mutated.

## Public Passage Detail Paragraph

The client receives the following subset:

```text
{
  paragraphId: string,
  index: number,
  sourceText: string,
  translation?: string,
  translationState: "missing" | "available" | "generating" | "error",
  translationError?: string,
  translationUpdatedAt?: string
}
```

The raw `passage` string remains in the detail response for existing vocabulary highlighting and word-action generation. The ordered paragraph list is the source of truth for paragraph translation rendering.

## Translation Operation

A transient request and, for AI work, a persisted paragraph claim.

| Field          | Type                                                                  | Description                                     |
| -------------- | --------------------------------------------------------------------- | ----------------------------------------------- |
| `recordId`     | string                                                                | Parent passage identifier.                      |
| `paragraphId`  | string                                                                | Target paragraph identifier.                    |
| `kind`         | `manual-add \| manual-edit \| ai-generate \| ai-regenerate \| delete` | Requested operation.                            |
| `operationId`  | string or absent                                                      | Server-generated claim token for AI generation. |
| `status`       | `idle \| saving \| generating \| deleting \| succeeded \| failed`     | Client request state.                           |
| `errorMessage` | string or absent                                                      | User-facing failure message.                    |

## State Transitions

```text
missing -> editing -> available
missing -> generating -> available
missing -> generating -> error
available -> editing -> available
available -> generating -> available
available -> generating -> error (previous translation preserved)
generating + expired lease -> missing | available | error
available -> deleting -> missing
error -> generating -> available | error
```

Manual Save and Delete operations are transactional and reject while the same paragraph has `translationState = generating`, unless the operation lease has expired and is reclaimed in that transaction. AI completion/failure is accepted only when its operation ID matches the current claim. A successful AI result clears `translationError`; a failed regeneration keeps the prior `translation` and sets `translationState = error`. The lease must exceed the maximum provider timeout and retry budget; one named duration is used by claim and reclaim logic.

## Validation and Ownership

- Paragraph normalization must produce at least one non-empty paragraph for a valid passage.
- `paragraphId` must exist in the selected passage and must match the stored paragraph source identity.
- Manual translation text is trimmed and must contain at least one non-whitespace character.
- AI output is trimmed and must be a non-empty string validated by the translation response schema.
- Translation mutations must resolve `users/{uid}/passages/{recordId}` using the authenticated UID; no client-supplied UID is trusted.
- Internal operation IDs and claim metadata are not part of public API responses.
- An abandoned AI claim must be reclaimable after `translationOperationExpiresAt`; reclaiming it must clear the stale claim and preserve any existing translation.
- Translation updates must not modify passage title, raw source text, vocabulary list/count, or sibling paragraph entries.
