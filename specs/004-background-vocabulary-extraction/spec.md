# Feature Specification: Background Vocabulary Extraction

**Feature Branch**: `004-background-vocabulary-extraction`

**Created**: 2026-08-17

**Status**: Draft

**Input**: User description: "Background Vocabulary Extraction\n\nAs a user of Vocab Miner\nI want vocabulary extraction to run in the background after I submit a passage\nSo that I can continue using the app while extraction is in progress, instead of being blocked by a full-page loading state"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Submit Without Blocking (Priority: P1)

As a Vocab Miner user, I want my passage saved immediately when I submit it so that I can continue using the app while vocabulary extraction is in progress.

**Why this priority**: Removing the blocking state is the primary user value and makes the app usable during slow extraction requests.

**Independent Test**: Submit a valid title and passage while the extraction service is delayed, then confirm that the passage appears in history as pending and that the user can navigate to another app view before extraction finishes.

**Acceptance Scenarios**:

1. **Given** a user has entered a valid passage title and content, **When** they select Submit, **Then** a new history record is created with the title, content, submission timestamp, `pending` status, and an empty vocabulary list.
2. **Given** a passage has been submitted and extraction is still pending, **When** the submission is accepted, **Then** the user is returned to a usable app view without a full-page loading overlay blocking interaction.
3. **Given** a passage is pending, **When** the user opens the passage history, **Then** the record is visible with a clear pending indicator and no vocabulary count suggesting completed extraction.

### User Story 2 - Monitor Completed Extraction (Priority: P2)

As a Vocab Miner user, I want to revisit passage history and see when extraction finishes so that I can use the resulting vocabulary without keeping the submission screen open.

**Why this priority**: Background work only delivers value if users can discover and use its result after leaving the submission flow.

**Independent Test**: Submit a passage, leave the submission view, allow extraction to finish, and reopen history and the passage detail view to verify the completed status and vocabulary list.

**Acceptance Scenarios**:

1. **Given** a pending passage extraction completes successfully, **When** the user views history or the passage detail, **Then** the record status is `completed` and the extracted vocabulary is populated.
2. **Given** a user returns to the history view after submitting a passage, **When** the extraction status has changed, **Then** the displayed status and vocabulary count reflect the latest saved record state.
3. **Given** a completed passage has extracted vocabulary, **When** the user opens its detail view, **Then** the passage content and vocabulary are available in the same history workflow as other completed passages.

### User Story 3 - Recover From Extraction Failure (Priority: P2)

As a Vocab Miner user, I want to understand and retry a failed extraction so that a temporary provider or network problem does not permanently lose my passage.

**Why this priority**: Failed background work must be recoverable because the passage itself has already been saved and should remain useful.

**Independent Test**: Force extraction to fail, open the affected passage from history, verify the error state and retry control, then retry and confirm that the passage returns to pending.

**Acceptance Scenarios**:

1. **Given** background extraction fails for a saved passage, **When** the failure is recorded, **Then** the passage status becomes `error`, an understandable error reason is stored, and the original title and content remain available.
2. **Given** a passage has `error` status, **When** the user opens its detail view, **Then** an error state shows the saved passage context and provides a Retry action.
3. **Given** a passage has `error` status, **When** the user selects Retry, **Then** the record status returns to `pending`, the prior extracted vocabulary is cleared or remains empty, and the user can leave the view while extraction runs again.

### Edge Cases

- If the title or passage content is missing or invalid, submission is rejected before a pending history record is created, and the user receives an actionable validation message.
- If the user navigates away, closes the browser, or loses connectivity after submission, the saved record remains available in history and its eventual status can be checked later.
- If extraction returns no vocabulary, the record is still marked `completed` with an empty vocabulary list rather than treated as a failure.
- If a retry is selected while an extraction for the same passage is already pending, the system prevents duplicate active extraction work and keeps one authoritative status for the record.
- If history or detail data cannot be loaded, the user sees a recoverable loading or error state without losing the saved passage.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST validate the passage title and content before creating a history record.
- **FR-002**: The system MUST create a new passage history record immediately after a valid submission is accepted, storing the title, content, submission timestamp, `pending` status, and an empty vocabulary list.
- **FR-003**: The system MUST start vocabulary extraction independently of the user's continued interaction with the app after the pending record is created.
- **FR-004**: The system MUST allow the user to navigate to other usable app views while extraction is pending, without a full-page loading state blocking interaction.
- **FR-005**: The system MUST update a pending record to `completed` and store the extracted vocabulary when extraction succeeds.
- **FR-006**: The system MUST update a pending record to `error` and store an understandable error reason when extraction fails.
- **FR-007**: The system MUST expose each passage's current extraction status in passage history, including `pending`, `completed`, and `error` states.
- **FR-008**: The system MUST preserve the original title and content when extraction succeeds or fails.
- **FR-009**: The passage detail view MUST present an error state and a Retry action for records with `error` status.
- **FR-010**: Selecting Retry MUST reset the record to `pending`, clear any stale extraction result, and start extraction again for the saved passage.
- **FR-011**: The system MUST prevent a retry from creating duplicate active extraction work for the same passage record.
- **FR-012**: A successful extraction with zero vocabulary results MUST be represented as `completed` with an empty vocabulary list.
- **FR-013**: The system MUST keep passage history records isolated to the authenticated user who created them.

### Key Entities

- **Passage History Record**: A user's saved passage with its record identifier, title, content, submission timestamp, current extraction status, optional error reason, vocabulary list, and vocabulary count.
- **Extraction Attempt**: A background processing attempt associated with one passage history record, ending in success or failure and driving the record's status update.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: For at least 95% of valid submissions, the user's passage appears in history with `pending` status within 2 seconds of selecting Submit, excluding time spent waiting for vocabulary extraction.
- **SC-002**: In usability checks with an intentionally delayed extraction service, 100% of participants can navigate to another app view after submitting without waiting for extraction to finish.
- **SC-003**: At least 95% of successful extraction attempts update the corresponding history record to `completed` with the returned vocabulary available within 10 seconds of the provider response.
- **SC-004**: 100% of failed extraction attempts leave the original passage recoverable in history with `error` status, an error reason, and a visible Retry action.
- **SC-005**: At least 90% of users who retry a failed extraction can initiate the retry in one attempt and see the record return to `pending` within 2 seconds.
- **SC-006**: No authenticated user can view, retry, or modify another user's passage extraction records.

## Assumptions

- Existing authentication and passage history access controls continue to identify the current user.
- The existing passage submission form remains the entry point for creating extraction records.
- Users can refresh or revisit history to observe a status change; real-time status updates are desirable but not required for the feature to provide value.
- The extraction provider may take several minutes or fail temporarily, so status and error information must be durable rather than held only in the submission view.
- Existing completed passage and vocabulary presentation patterns remain the default for completed records.
- Version one does not require users to cancel an in-progress extraction.
