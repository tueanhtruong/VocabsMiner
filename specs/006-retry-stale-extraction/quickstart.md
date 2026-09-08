# Quickstart: Retry Stale Pending Extraction

## Prerequisites

- Node.js 20 or newer
- pnpm dependencies installed
- Firebase emulator or configured development Firebase project
- Authenticated test user
- A way to delay or manually hold the vocabulary provider response

## Static Validation

Run the repository quality gates:

```bash
pnpm lint
pnpm --dir functions lint
```

Both commands must exit with code `0`. No automated test framework is introduced by this feature.

## Scenario 1: Fresh Pending Passage Has No Retry

1. Submit a valid passage through the existing extraction flow.
2. Open its passage detail page immediately.
3. Confirm the page shows `Extraction pending` and no stale-pending Retry button.
4. Confirm the stored/detail response has `status: "pending"` and a `pendingSince` value.

## Scenario 2: Threshold Boundary

1. Prepare pending records with `pendingSince` exactly 15 minutes ago and more than 15 minutes ago.
2. Open or keep open each detail page until the threshold is crossed.
3. Confirm exactly-15-minute records do not show Retry.
4. Confirm records beyond 15 minutes show Retry without resubmitting or losing passage context.

## Scenario 3: Successful Stale Retry

1. Hold extraction for a passage until it is more than 15 minutes pending.
2. Select Retry once.
3. Confirm the control shows progress and cannot be submitted repeatedly.
4. Confirm the passage title and source content remain unchanged, vocabulary is reset to the pending representation, and `pendingSince` is refreshed.
5. Allow extraction to finish and confirm the passage becomes completed with its vocabulary result.
6. Refresh or leave the page during processing and confirm the saved passage remains available.

## Scenario 4: Retry Race and Stale Worker

1. Start with a stale pending passage and submit two Retry requests close together.
2. Confirm only one request resets the stale lifecycle and only one fresh active attempt can claim it.
3. Allow the old pre-retry worker to return after the reset.
4. Confirm its result does not overwrite the fresh attempt's pending or completed state.

## Scenario 5: Retry Failure and Existing Error Recovery

1. Make the provider fail after a stale retry is accepted.
2. Confirm the passage remains saved with `error` status, a sanitized error reason, and the existing error Retry path.
3. Confirm completed passages do not show the stale-pending Retry action.
4. Confirm an error record can still be retried using the pre-existing recovery behavior.

## Scenario 6: Ownership and Invalid State

1. Attempt to load and retry another user's stale passage with a different authenticated account.
2. Confirm the record is not exposed and no extraction attempt changes.
3. Attempt retry for a fresh pending, completed, exactly-threshold, or timestamp-missing record.
4. Confirm the request is rejected with the appropriate recoverable error and the record is unchanged.
