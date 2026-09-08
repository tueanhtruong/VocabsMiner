# Feature Specification: Retry Stale Pending Extraction

**Feature Branch**: `006-retry-stale-extraction`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "I want to add a retry feature for passages with an \"Extraction pending\" status. If a passage has been in this status for more than 15 minutes, its detail page should display a \"Retry\" button that allows users to restart the vocabulary extraction process."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Recover a Stuck Extraction (Priority: P1)

As a Vocab Miner user, I want to retry a passage whose extraction has remained pending for more than 15 minutes so that I can recover from an extraction attempt that may have stopped making progress.

**Why this priority**: A stale pending passage gives the user no way to recover a saved passage through the existing workflow. This is the core value of the feature.

**Independent Test**: Create or prepare a passage whose current extraction attempt began more than 15 minutes ago, open its detail page, select Retry, and confirm that the passage returns to a fresh pending extraction attempt without losing its title or content.

**Acceptance Scenarios**:

1. **Given** an authenticated user owns a passage that has had `pending` status for more than 15 minutes, **When** the user opens the passage detail page, **Then** the page displays a Retry button for that passage.
2. **Given** an authenticated user owns a passage that has had `pending` status for exactly 15 minutes or less, **When** the user opens the passage detail page, **Then** the stale-pending Retry button is not displayed.
3. **Given** a passage has a stale pending extraction and the user selects Retry, **When** the retry is accepted, **Then** the passage remains available with its original title and content, its extraction state is reset to a new pending attempt, and the new attempt's elapsed time starts over.
4. **Given** a retry has been accepted, **When** the user leaves or refreshes the passage detail page, **Then** the passage remains visible in history and the extraction can continue independently of the current page.

### User Story 2 - Understand Retry Progress and Outcomes (Priority: P1)

As a Vocab Miner user, I want clear feedback while a stale extraction is being restarted so that I know whether the retry was accepted and what to do if it fails again.

**Why this priority**: Restarting background work is only useful when the user can distinguish an accepted retry from a failed request or an extraction that completed while the detail page was open.

**Independent Test**: Exercise retry with a delayed successful extraction, a failed extraction, and a stale detail view, then verify the displayed state and available actions for each outcome.

**Acceptance Scenarios**:

1. **Given** the user selects Retry for an eligible passage, **When** the retry request is being processed, **Then** the Retry control shows an in-progress state and prevents repeated submissions for that same passage.
2. **Given** a retry starts successfully, **When** vocabulary extraction completes, **Then** the passage reaches the existing completed state and displays the resulting vocabulary.
3. **Given** a retry starts successfully, **When** vocabulary extraction fails, **Then** the passage reaches the existing error state with an understandable error reason and the original passage remains available through history and detail.
4. **Given** the detail page was opened before the passage became eligible or before another process changed its status, **When** the user attempts an action using that stale view, **Then** the system rechecks the current passage state, prevents an invalid duplicate or late retry, and shows the latest state.

### User Story 3 - Keep Passage Recovery Secure (Priority: P1)

As a Vocab Miner user, I want retry behavior to follow the same ownership rules as passage history so that restarting extraction cannot affect another user's passage.

**Why this priority**: Retry changes background processing and must not create a way to access or mutate records outside the authenticated user's ownership boundary.

**Independent Test**: Attempt to view and retry a stale pending passage using a different authenticated account, then verify that the passage is not exposed and no extraction attempt is changed.

**Acceptance Scenarios**:

1. **Given** a stale pending passage belongs to another user, **When** a user attempts to open or retry it, **Then** the passage is not revealed and no retry is started.
2. **Given** a user submits repeated Retry actions for the same eligible passage, **When** the requests overlap, **Then** only one new extraction attempt is started and the passage has one authoritative pending state.

### Edge Cases

- A passage that has been pending for exactly 15 minutes is not eligible; eligibility begins only after the full 15-minute threshold has passed.
- If extraction completes or enters an error state before the user selects Retry, the stale-pending action is rejected or removed and the detail page reflects the newer state instead of starting another attempt.
- A retry request that fails before the new attempt is accepted leaves the existing passage and its current state intact and shows an actionable error message.
- A passage with a missing or unusable start time for its current pending attempt does not receive a stale-pending Retry action until the state can be evaluated reliably.
- Repeated retries after a successful reset do not become available again immediately because the new pending attempt has its own fresh start time.
- Refreshing or navigating away during retry does not cancel an accepted extraction attempt.
- A passage with an extraction error continues to use the existing error recovery behavior; this feature adds stale-pending recovery without removing that behavior.
- A passage with no extracted vocabulary after a successful retry is still marked completed according to the existing extraction rules.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST record or expose the start time of the current vocabulary extraction attempt so that the duration of a pending state can be evaluated.
- **FR-002**: The system MUST consider a passage eligible for stale-pending retry only when its current extraction status is `pending` and more than 15 minutes have elapsed since the current attempt began.
- **FR-003**: The passage detail page MUST display a Retry button for an eligible stale pending passage.
- **FR-004**: The passage detail page MUST NOT display the stale-pending Retry button for passages that are completed, in error, not yet beyond 15 minutes of pending time, or whose pending duration cannot be evaluated reliably.
- **FR-005**: Selecting Retry MUST recheck the passage's current ownership, status, and pending duration before accepting a new extraction attempt.
- **FR-006**: An accepted retry MUST create one fresh vocabulary extraction attempt, return the passage to pending state, and reset the pending start time for that attempt.
- **FR-007**: An accepted retry MUST preserve the passage title and source content, and MUST prevent stale vocabulary output from being presented as the result of the new attempt.
- **FR-008**: The system MUST prevent repeated or overlapping Retry actions for the same passage from starting duplicate active extraction attempts.
- **FR-009**: The detail page MUST provide visible in-progress feedback while a retry is being accepted and MUST provide an actionable error state when the retry request cannot be accepted.
- **FR-010**: The existing extraction completion behavior MUST remain available after a retry, including marking the passage completed and showing extracted vocabulary when processing succeeds.
- **FR-011**: If extraction fails after a retry is accepted, the system MUST preserve the original passage and record the existing error state and understandable error reason.
- **FR-012**: The system MUST enforce authenticated ownership for viewing a passage and accepting a retry, and MUST prevent a user from starting extraction for another user's passage.
- **FR-013**: When the passage detail page remains open as a pending passage crosses the 15-minute threshold, the page MUST make the Retry action available without requiring the user to lose the passage context or submit the passage again.

### Key Entities _(include if feature involves data)_

- **Passage History Record**: A user's saved passage with its title, source content, extraction status, current attempt start time, vocabulary result, and optional error reason.
- **Extraction Attempt**: One vocabulary processing run for a passage, identified by its start time and current lifecycle state; a retry creates a new attempt rather than extending the stale one.
- **Stale-Pending Retry Action**: A user-initiated request to replace an eligible, long-running pending extraction with one fresh extraction attempt.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of passages that are pending for more than 15 minutes show a Retry button on their detail page when viewed by their owning user.
- **SC-002**: 100% of passages pending for 15 minutes or less, completed, or in error do not show the stale-pending Retry button.
- **SC-003**: At least 95% of valid Retry actions return the passage to a fresh pending state within 2 seconds of the user selecting Retry, excluding time spent on vocabulary extraction.
- **SC-004**: In all successful retry scenarios, 100% of original passage titles and source content remain available after the retry starts.
- **SC-005**: In simulated overlapping Retry requests, 100% of eligible passages start no more than one new active extraction attempt.
- **SC-006**: At least 95% of successful retry attempts reach the existing completed state with vocabulary results available within 10 seconds after the extraction provider responds.
- **SC-007**: 100% of simulated extraction failures after retry preserve the passage in history with an understandable error state and existing recovery path.
- **SC-008**: 100% of authorization checks prevent a user from viewing or retrying another user's passage.

## Assumptions

- The existing background extraction workflow, passage detail page, history view, authentication, and ownership checks remain the foundation for this feature.
- The 15-minute threshold is measured from the start of the current pending extraction attempt, not from the passage's original creation time or the user's last page visit.
- A retry replaces the stale attempt rather than running concurrently with it; any previous attempt that later reports a result must not overwrite the new attempt's authoritative state.
- Existing completed, error, and zero-vocabulary outcomes remain unchanged except that a stale pending passage can now be recovered before it reaches an error state.
- Users may need to refresh or allow the detail page to re-evaluate its elapsed time, but the page must not require resubmitting the original passage.
- Version one does not include cancellation of a currently active extraction attempt or user-configurable retry thresholds.
