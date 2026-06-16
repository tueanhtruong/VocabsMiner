# Research: Vocabulary Extraction & History Flow

## Decision 1: Persist Full Extraction Record As Passage Unit

- Decision: Save each successful extraction as one user-owned passage extraction record containing title, full passage text, and vocabulary list.
- Rationale: Matches required record shape and simplifies detail-page loading from a single source.
- Alternatives considered:
  - Splitting passage and vocabulary into separate write paths first: rejected due to higher write complexity for this flow.
  - Saving only passage metadata and refetching vocabulary later: rejected because detail page requires immediate, stable rendering.

## Decision 2: Submission Gate On Required Inputs

- Decision: Enforce both title and passage as required before allowing extraction submission.
- Rationale: Directly satisfies the dashboard flow requirement and avoids partial/invalid extraction requests.
- Alternatives considered:
  - Allow empty title with server-generated fallback: rejected because user-provided title is explicitly required.
  - Allow draft submission with partial input: rejected as non-essential complexity.

## Decision 3: Post-Save Redirect Contract

- Decision: Redirect to detail page only after extraction succeeds and persistence succeeds.
- Rationale: Prevents navigation to missing/unsaved details and aligns with FR-007.
- Alternatives considered:
  - Redirect immediately after extraction and save in background: rejected due to risk of broken detail page state.
  - Keep user on dashboard and show modal: rejected because required behavior is automatic navigation to detail.

## Decision 4: Detail Page Interaction Pattern

- Decision: Use a two-panel detail layout where selecting a vocabulary word drives highlighted matches in the passage panel.
- Rationale: Supports contextual study behavior and maps directly to user story 2.
- Alternatives considered:
  - Tooltip-only definitions with no text highlighting: rejected because passage context mapping is required.
  - Separate tabbed UI instead of split panels: rejected due to mismatch with requested panel layout.

## Decision 5: Highlight Matching Strategy

- Decision: Perform case-insensitive exact-term matching with punctuation-tolerant boundaries for highlight rendering.
- Rationale: Balances accuracy and usability for repeated words and sentence punctuation.
- Alternatives considered:
  - Strict case-sensitive matching: rejected due to missed matches in natural text.
  - Semantic/fuzzy matching: rejected for v1 due to ambiguity and unnecessary complexity.

## Decision 6: Sidebar History As Primary Review Entry

- Decision: Replace Vocabulary Bank sidebar area with Passage History list and remove standalone history route from primary navigation.
- Rationale: Aligns discovery and review around passage-centric workflow and requested nav changes.
- Alternatives considered:
  - Keep both Vocabulary Bank and Passage History: rejected as conflicting with explicit replacement request.
  - Keep old history route and add sidebar list: rejected because route removal is required.

## Decision 7: Ownership & Access Isolation

- Decision: All history/detail reads and writes remain scoped to authenticated user UID.
- Rationale: Prevents cross-user history visibility and supports SC-006.
- Alternatives considered:
  - Client-side filtering of global history records: rejected due to security risk.
  - Shared records with role filters: rejected as out-of-scope for single-user study history.

## Decision 8: Failure State Handling

- Decision: Show explicit UI feedback for extraction failure, save failure, history load failure, and missing detail records.
- Rationale: Required for FR-016 and edge-case transparency.
- Alternatives considered:
  - Silent retries with generic error state: rejected due to poor user clarity.
  - Hard-fail page crashes for missing data: rejected as unacceptable UX.
