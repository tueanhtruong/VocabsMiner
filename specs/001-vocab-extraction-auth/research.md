# Research: Vocab Extraction Authentication

## Decision 1: Authentication Method

- Decision: Use Firebase Auth with Google sign-in as the only supported login method.
- Rationale: Matches clarified product scope, minimizes auth surface area, and provides a stable UID for ownership keying.
- Alternatives considered:
  - Email/password auth: rejected because it conflicts with clarified Google-only login.
  - Multi-provider auth: rejected for v1 due to additional UI/rules complexity.

## Decision 2: User Identity and Ownership Key

- Decision: Use Firebase `auth.uid` as the canonical profile identifier and ownership key for all stored data.
- Rationale: UID is immutable, globally unique per Firebase project, and directly available after successful authentication.
- Alternatives considered:
  - Custom generated profile IDs: rejected due to duplication and mapping overhead.
  - Email as key: rejected because email can change and is less stable.

## Decision 3: Firestore Data Partitioning

- Decision: Store data in user-scoped paths rooted at `users/{uid}` with dedicated subcollections for passage history and vocabulary history.
- Rationale: Strong tenant isolation model, straightforward security rules, and efficient per-user queries.
- Alternatives considered:
  - Flat global collections with `uid` field filters: rejected due to higher risk of mis-scoped queries and heavier indexing.
  - Embedded large arrays on profile document: rejected due to document size limits and poor pagination.

## Decision 4: Vocabulary De-duplication

- Decision: Use deterministic normalized word keys for vocabulary entries and merge writes to prevent duplicate items while tracking passage references.
- Rationale: Supports FR-012 and avoids duplicated vocabulary rows across repeated passages.
- Alternatives considered:
  - Always append with random IDs: rejected due to duplicate explosion and weaker review UX.
  - Full semantic deduping by AI confidence: rejected as over-scope for v1.

## Decision 5: OpenRouter Integration Boundary

- Decision: Invoke OpenRouter only from server-side Next.js route handlers (not client components).
- Rationale: Protects API keys, centralizes validation, and allows controlled retry/timeout handling.
- Alternatives considered:
  - Direct client-side OpenRouter calls: rejected due to credential exposure risk.
  - Separate backend service: rejected for v1 to preserve single-app simplicity.

## Decision 6: Response Shape Validation

- Decision: Validate extraction response payload against a strict runtime schema before persistence.
- Rationale: Prevents malformed or oversized model outputs from corrupting user data.
- Alternatives considered:
  - Trust raw model output: rejected due to reliability and safety concerns.
  - Loose partial validation only: rejected because key entities require consistent shape for history rendering.

## Decision 7: Resilience and Failure Handling

- Decision: Apply bounded timeout plus limited retries for transient extraction failures, and return explicit user-facing failure states.
- Rationale: Supports FR-011 and keeps latency aligned with SC-003 while avoiding indefinite waits.
- Alternatives considered:
  - No retry: rejected due to weaker reliability under transient provider failures.
  - Unlimited retry: rejected due to poor UX and runaway costs.

## Decision 8: Security Rule Strategy

- Decision: Use Firestore Security Rules that allow read/write only when `request.auth.uid == {uid}` for profile and child history documents.
- Rationale: Directly enforces FR-010 and SC-006 (no cross-account visibility).
- Alternatives considered:
  - App-layer checks only: rejected because rules are mandatory defense-in-depth.
  - Broad authenticated access: rejected due to data leakage risk.

## Decision 9: History Retrieval and Pagination

- Decision: Design passage and vocabulary history queries with timestamp ordering and cursor-based pagination.
- Rationale: Keeps profile history responsive as data grows and supports SC-007.
- Alternatives considered:
  - Load complete history every request: rejected due to performance degradation.
  - Aggregate snapshots only: rejected due to lower learner utility.

## Decision 10: Scope Guardrails for v1

- Decision: Keep v1 focused on sign-in gate, extraction, save/retrieve history, and profile history display.
- Rationale: Aligns with constitution YAGNI principle and avoids schedule risk.
- Alternatives considered:
  - Add spaced repetition/gamification now: rejected as out-of-scope per assumptions.
  - Add admin analytics in v1: rejected as non-core learner value.
