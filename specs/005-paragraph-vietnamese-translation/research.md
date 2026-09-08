# Research: Paragraph-Level Vietnamese Translation & Management

## Decision 1: Persist an ordered paragraph array on each passage document

**Decision**: Add an ordered `paragraphs` field to the existing passage history document. Each entry stores a stable paragraph identifier, its display order, source text, translation state, and optional Vietnamese translation/error metadata. Keep the raw `passage` field for existing vocabulary highlighting and backward compatibility.

**Rationale**: The current application already reads and writes one passage document under `users/{uid}/passages/{recordId}` and returns one passage detail payload. Embedding the ordered records keeps the detail query simple, preserves user ownership boundaries, and avoids introducing a new collection or synchronization layer for a narrow feature. Firestore transactions can update only the selected array entry while preserving sibling entries.

**Alternatives considered**:

- A `paragraphs` subcollection would scale better for very large passages and high write concurrency, but it adds extra reads, new security-rule paths, and more complex detail assembly.
- Re-splitting the raw passage on every render would avoid a schema field, but it could associate saved translations with different paragraphs after whitespace normalization and would not give existing records a durable identity.

## Decision 2: Define paragraphs as non-empty blocks separated by one or more blank lines

**Decision**: Normalize `\r\n` to `\n`, trim the passage, split on one or more blank-line boundaries (`\n\s*\n`), trim each block, and discard empty blocks. Preserve single newlines inside a block for display. Generate deterministic IDs from the normalized paragraph index and source-text hash.

**Rationale**: The current reader treats all whitespace as part of one raw text stream and has no paragraph model. Blank-line blocks match the common passage format, prevent leading/trailing empty lines from creating records, and preserve line breaks that may be meaningful within a paragraph. Persisting the normalized source text makes the association deterministic for existing and new passages.

**Alternatives considered**:

- Splitting every newline would misclassify wrapped lines and would create too many AI requests for pasted passages.
- Storing only an array index would be smaller, but a source-text hash makes accidental association changes detectable and gives IDs that remain stable when the same passage is backfilled.

## Decision 3: Keep translation generation independent from vocabulary extraction

**Decision**: The existing background extraction flow remains authoritative for vocabulary status. The Firebase Functions worker is the sole production owner of new-passage vocabulary and paragraph translation processing. The Next.js `/api/extract/process` path is an explicit local/manual fallback only and is not dispatched automatically in production. If both paths are invoked accidentally, passage and paragraph claims make the second invocation a no-op.

After a passage is claimed, translation generation is initiated per paragraph and each result is finalized independently. Translation failure sets only that paragraph's translation error state; it never changes passage-level extraction status or clears vocabulary. Translation calls may run concurrently with a bounded per-passage fan-out; each completion writes only its paragraph.

**Rationale**: The specification requires usable vocabulary and successful translations to survive an unrelated translation failure. A separate per-paragraph state also supports partial completion, retry, and progress without inventing a general-purpose job queue.

**Alternatives considered**:

- Waiting for every translation before marking vocabulary extraction complete would make unrelated provider latency block a successful extraction.
- Fire-and-forget work from the submission route is not durable after a serverless response and conflicts with the existing background-extraction architecture.
- Running both the Firebase worker and Next.js route as equal production owners could duplicate provider calls; production ownership must be explicit and claim-guarded.
- A separate translation queue collection would be more operationally explicit but exceeds the feature's minimal scope.

## Decision 4: Use server-side OpenRouter for saved paragraph translations

**Decision**: Add a dedicated OpenRouter helper that requests one paragraph at a time and validates a strict `{ "translation": string }` response with Zod. Reuse the existing OpenRouter configuration, timeout, retry, and typed provider-error patterns. Keep the browser-only selected-word translation flow unchanged.

**Rationale**: Paragraph translations are persisted, regenerated, retried, and ownership-protected. The existing OpenRouter integration already supports structured responses and server-only credentials, while the selected-word Google Translate path is transient and has no persistence or operation identity.

**Alternatives considered**:

- Extending the selected-word Google Translate helper would mix a short-lived client interaction with a durable server contract and expose a different provider path.
- One batch request for every paragraph could reduce request count, but a single-paragraph request isolates failures and makes Generate/Regenerate semantics and progress straightforward.

## Decision 5: Guard AI operations with per-paragraph operation IDs and Firestore transactions

**Decision**: AI generation claims a paragraph by writing `generating` and a server-generated operation ID in a transaction. Completion or failure may update the paragraph only when that operation ID is still current. Manual save/delete operations reject a paragraph currently being generated; a failed generation preserves any prior translation and exposes a retry/manual path.

**Rationale**: The feature explicitly requires overlapping operations not to produce an ambiguous final state and requires regeneration failures to preserve the old text. Claim/finalize transactions prevent a slow or stale provider response from overwriting a newer result.

**Alternatives considered**:

- Ordinary read-then-update mutations could lose concurrent edits or let an older AI response win.
- Client-only request disabling improves normal UX but does not protect against duplicate tabs, retries, or delayed server responses.

## Decision 8: Verify Firebase identity before applying ownership checks

**Decision**: Every authenticated API route must verify the Firebase ID token with Firebase Admin Auth and derive the owner UID only from the verified token subject. The raw Bearer value must never be treated as a UID. Invalid, expired, or malformed tokens are rejected before any passage lookup or mutation.

**Rationale**: Firestore path scoping is only an effective ownership boundary when the UID is trusted. The current helper accepts the raw Bearer value as the UID, so translation routes would otherwise satisfy the shape of an owner check without providing authenticated identity.

**Alternatives considered**:

- Trusting a client-stored UID or raw bearer value is not an authorization mechanism.
- Deferring verification to translation routes would leave existing extraction, history, and vocabulary routes with the same ownership weakness and create inconsistent auth behavior.

## Decision 6: Add a narrow authenticated translation API and extend passage detail

**Decision**: Return public paragraph data in the existing passage detail response and add `app/api/translations/route.ts` for authenticated POST, PUT, and DELETE operations. Every mutation includes `recordId` and `paragraphId`; the service resolves the document under the authenticated user's path and maps domain errors to the existing API error format.

**Rationale**: The detail query already owns the passage and vocabulary view, while a focused route avoids overloading the vocabulary endpoint with a separate entity's operations. Existing `requestJson`, `apiOk`, `apiError`, and UID-scoped service patterns can be reused.

**Alternatives considered**:

- Adding translation actions to `/api/vocabulary` would couple unrelated contracts and make the endpoint harder to reason about.
- A separate GET endpoint is unnecessary because the existing passage detail response can return paragraphs in one read.

## Decision 7: Make the shared passage reader paragraph-aware

**Decision**: Update the shared `PassagePanel`/`PassageText` path used by desktop and mobile to render ordered paragraph blocks. Keep token-level word selection and highlight range behavior within each paragraph, and add independent local expansion/editing/operation state keyed by `paragraphId`.

**Rationale**: Both desktop and mobile already converge on `PassagePanel`; changing this shared boundary prevents divergent translation behavior. Local state is sufficient for expansion and form drafts, while React Query cache updates/refetches provide durable data freshness.

**Alternatives considered**:

- Separate desktop and mobile translation implementations would duplicate behavior and invite drift.
- A new global state library is unnecessary and violates the project's simplicity principle.

## Resolved Risks

- Legacy records without `paragraphs` receive a deterministic paragraph projection on read and are lazily persisted by the first compatible passage-detail or mutation write. This avoids a one-time migration while making future writes use the durable model.
- Translation writes retrigger the existing Firestore passage trigger, but the worker exits for non-`pending` passage status, so translation updates do not re-run vocabulary extraction.
- Translation metadata is kept separate from passage-level `status`, `errorReason`, and `activeAttemptId`; vocabulary retry cannot erase paragraph translations.
- The public response omits the internal operation ID while retaining user-facing `translationState` and sanitized `translationError`.
