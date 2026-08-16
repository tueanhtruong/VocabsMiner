# Research: Background Vocabulary Extraction

## Decision: Use a Firestore-triggered Firebase Function for durable extraction

**Rationale**: The current Next.js route waits for OpenRouter before writing history. Returning a response and leaving a promise running is not a durable background-job mechanism: a serverless process can be frozen or terminated after the response, and the browser may be closed. A Firestore trigger runs independently of the submitting request and can continue after navigation or browser shutdown. Firebase is already the application's backend and persistence platform, so this keeps the feature within the repository constitution.

**Alternatives considered**:

- **Next.js fire-and-forget after returning the response**: Rejected because execution is not guaranteed beyond the route lifecycle and failures may never update the record.
- **Client-side request that continues after navigation**: Rejected because it depends on the browser remaining open and connected.
- **External queue or job provider**: Rejected because it adds a backend dependency when Firebase already provides event-driven execution.

## Decision: Trigger from the passage document's pending transition

**Rationale**: The existing passage document already contains the title and passage content needed by the worker. Creating a separate queue document would duplicate payload data and add another persistence surface. A trigger can run on create/update and only process records whose status is `pending`.

**Alternatives considered**:

- **Separate extraction-jobs collection**: Rejected for the minimum viable scope; it would require queue lifecycle, cleanup, and additional API/data-model work.
- **Scheduled polling worker**: Rejected because it adds latency and infrastructure for a problem that Firestore events already solve.

## Decision: Use transactional attempt claims for idempotency

**Rationale**: Firestore event delivery can be retried, and a user may retry a failed record while a stale worker is finishing. The worker claims a pending record with a unique attempt token in a transaction. Final writes only apply when that token still owns the attempt, preventing duplicate processing and stale results from overwriting a newer retry.

**Alternatives considered**:

- **Rely on one trigger delivery**: Rejected because duplicate delivery and retries are normal distributed-system behavior.
- **Expose a visible `processing` status**: Rejected because the user-facing contract only needs `pending`, `completed`, and `error`; claim metadata can remain internal to the record.

## Decision: Poll status only while the detail view is active, with refreshable history

**Rationale**: The existing app uses TanStack Query and authenticated API routes. Polling the detail query while it is open gives immediate feedback without adding Firestore client listeners or a new real-time infrastructure contract. History is refreshed on navigation and can be revisited after the user leaves.

**Alternatives considered**:

- **Client Firestore `onSnapshot` listeners**: Rejected for this scope because it would introduce a second data-access path around the existing API boundary.
- **Always-on application-wide polling**: Rejected because it wastes requests and conflicts with the requirement to keep the interaction local and lightweight.

## Decision: Keep provider errors sanitized at the user boundary

**Rationale**: The worker can log detailed provider failures server-side but stores a stable, understandable error reason such as provider unavailable or rate limited. Secrets, raw upstream payloads, and stack traces must not be exposed in history or detail responses.

**Alternatives considered**:

- **Persist raw exception messages**: Rejected because provider messages may contain implementation details or sensitive data and are not stable user-facing copy.
