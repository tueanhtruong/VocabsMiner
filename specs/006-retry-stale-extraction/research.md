# Research: Retry Stale Pending Extraction

## Decision: Track pending duration with a passage lifecycle timestamp

**Decision**: Add an optional `pendingSince` timestamp to the stored passage record. Set it when a passage first enters `pending` and whenever a retry is accepted. Expose it as an ISO timestamp in the passage-detail response while the status is pending.

**Rationale**: `activeAttemptId` is a worker claim token, not a reliable pending-duration clock. A record can remain pending before a worker claims it, and a claimed worker can be active while the record is still pending. A dedicated timestamp measures the user-visible lifecycle state and resets cleanly for retries.

**Alternatives considered**:

- Use `createdAt`: rejected because a retry must start a new 15-minute window without changing the original submission time.
- Use `updatedAt`: rejected because worker claims, paragraph updates, and other passage writes can change it without restarting extraction.
- Use `activeAttemptId` presence or claim time: rejected because unclaimed pending records have no claim and worker claim timing does not represent the full pending interval.

## Decision: Keep stale eligibility authoritative in a Firestore transaction

**Decision**: Extend the existing authenticated `POST /api/extract/retry` flow. The service transaction reads the owner-scoped passage, accepts error records using the existing behavior, or accepts pending records only when `now - pendingSince` is strictly greater than 15 minutes. It resets the record to a fresh pending state and clears the old claim token in the same transaction.

**Rationale**: The detail page can decide when to show the button for usability, but the server must recheck ownership, status, timestamp, and eligibility because the page may be stale and multiple requests may overlap. Clearing the old `activeAttemptId` makes any older worker finalization fail its existing claim-token check, so it cannot overwrite the new attempt.

**Alternatives considered**:

- Let the client decide eligibility: rejected because clients cannot be trusted for authorization or race-free state transitions.
- Add a separate retry/job collection: rejected because the existing passage document and transaction already provide the required ownership and idempotency boundary.
- Wait for the old worker to finish before retrying: rejected because the feature exists specifically to recover work that may be stuck.

## Decision: Preserve the existing Firebase trigger and local fallback claim model

**Decision**: Keep the Firebase Functions document trigger as the production processor and the existing `/api/extract/process` route as the explicit local/manual fallback. Both claim paths must preserve or backfill `pendingSince`, and both finalization paths must clear it when moving to `completed` or `error`.

**Rationale**: Retry changes the passage state, so the existing trigger and fallback dispatch mechanisms can restart processing without a new queue. Existing `activeAttemptId` checks already protect completion and failure writes from stale workers.

**Alternatives considered**:

- Introduce a new queue or scheduler: rejected as unnecessary for one passage document and contrary to the project constitution's simplicity requirement.
- Add a second worker path only for stale retries: rejected because it would duplicate extraction ownership and increase race risk.

## Decision: Expose the timestamp and refresh the detail view at the threshold

**Decision**: Add `pendingSince` to the passage detail DTO and client response type. The detail page derives stale eligibility from the timestamp and status, continues the existing pending polling, and schedules or uses a lightweight refresh at the 15-minute boundary so an open page can reveal Retry without resubmission.

**Rationale**: A server-computed boolean would become stale after the response is loaded. The timestamp lets the UI evaluate the exact boundary locally while the server remains authoritative when the action is submitted. Existing polling already refreshes pending detail records and preserves the user's passage context.

**Alternatives considered**:

- Require a full page refresh: rejected because the specification requires the action to become available while the detail page remains open.
- Poll a new eligibility endpoint: rejected because the existing passage-detail query already contains the necessary state.

## Decision: Use a backward-compatible read fallback for legacy pending records

**Decision**: New records always write `pendingSince`. For older pending records without that field, read logic may use their immutable `createdAt` as the pending-start fallback when it is a valid Firestore timestamp; records with neither a valid `pendingSince` nor valid `createdAt` are not eligible. Claim paths may persist the fallback when they touch a legacy record.

**Rationale**: Existing saved pending passages should not be stranded solely because they predate the field, and `createdAt` is the closest durable indication of when those records entered pending. No separate migration job is needed for this additive field.

**Alternatives considered**:

- Backfill every historical record before release: rejected because there is no migration framework and a safe read fallback covers the relevant records.
- Treat every missing field as ineligible: rejected because it leaves old pending passages permanently unrecoverable.
