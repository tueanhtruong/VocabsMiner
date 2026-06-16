# Feature Specification: Vocabulary Extraction & History Flow

**Feature Branch**: `[002-vocabulary-history-flow]`

**Created**: 2026-06-16

**Status**: Draft

**Input**: User description: "Feature Spec: Vocabulary Extraction & History Flow"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Extract Passage Vocabulary (Priority: P1)

As a signed-in user, I can enter a passage title and reading passage, submit extraction, and be taken directly to the saved detail view so I can start reviewing results immediately.

**Why this priority**: This is the primary value path and the main entry point for the feature.

**Independent Test**: Can be fully tested by entering a title and passage, submitting extraction, confirming a saved result record, and confirming automatic navigation to the corresponding detail page.

**Acceptance Scenarios**:

1. **Given** a signed-in user is on the dashboard, **When** they provide both a title and a passage, **Then** they can submit extraction.
2. **Given** a signed-in user has provided only one required field, **When** they attempt to submit, **Then** submission is blocked and the missing required input is clearly indicated.
3. **Given** extraction succeeds, **When** the result is saved to the user profile, **Then** the user is automatically navigated to the detail page for that saved passage.

---

### User Story 2 - Review Passage And Vocabulary Together (Priority: P2)

As a signed-in user, I can view the full passage and extracted vocabulary side by side, and click a vocabulary word to highlight matching text in the passage so I can study words in context.

**Why this priority**: Side-by-side contextual review is the core study experience after extraction.

**Independent Test**: Can be fully tested by opening a detail page with saved results, confirming two-panel layout, selecting vocabulary items, and verifying matching words are highlighted in the passage panel.

**Acceptance Scenarios**:

1. **Given** a saved extraction result exists, **When** the detail page loads, **Then** the left panel shows the full passage and the right panel shows extracted vocabulary words.
2. **Given** the user clicks a word in the vocabulary panel, **When** the click is processed, **Then** matching occurrences in the passage panel are visually highlighted.
3. **Given** the selected vocabulary word does not appear in the rendered passage text, **When** the user selects it, **Then** the UI clearly indicates no in-passage match.

---

### User Story 3 - Access Passage History From Sidebar (Priority: P3)

As a signed-in user, I can browse previously extracted passages from the sidebar and open any item in the detail page so I can revisit prior study sessions.

**Why this priority**: History navigation supports review and retention without repeating extraction.

**Independent Test**: Can be fully tested by completing multiple extractions, verifying sidebar history entries appear, selecting any entry, and confirming navigation to the correct detail page.

**Acceptance Scenarios**:

1. **Given** the user has prior extractions, **When** the sidebar is shown, **Then** it lists passage history items instead of a vocabulary bank section.
2. **Given** a history item is selected, **When** navigation occurs, **Then** the matching passage detail page is opened.
3. **Given** the navigation menu is displayed, **When** the user reviews available routes, **Then** no standalone history route entry is present.

### Edge Cases

- What happens when extraction returns an empty vocabulary list for a valid title and passage?
- How does the flow behave when extraction succeeds but saving to the user profile fails?
- How does the detail page behave when a saved record has an empty or malformed passage field?
- What happens when a history item references a passage that was deleted or is no longer accessible?
- How does highlighting behave for repeated words, punctuation variants, or case differences in the passage text?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST require a signed-in user context before allowing passage extraction submission.
- **FR-002**: System MUST provide two required dashboard inputs: passage title and reading passage.
- **FR-003**: System MUST block extraction submission until both required inputs are provided.
- **FR-004**: System MUST submit the provided title and passage for vocabulary extraction when the user starts extraction.
- **FR-005**: System MUST store each successful extraction result in the user profile with title, full passage, and extracted vocabulary list.
- **FR-006**: System MUST preserve the association between each saved extraction record and the user who created it.
- **FR-007**: System MUST automatically navigate the user to the corresponding detail page after successful extraction and successful save.
- **FR-008**: System MUST render the detail page in two panels: passage content on the left and extracted vocabulary list on the right.
- **FR-009**: System MUST allow selecting a vocabulary word from the right panel.
- **FR-010**: System MUST highlight matching occurrences of the selected vocabulary word in the left-panel passage.
- **FR-011**: System MUST provide clear feedback when no passage match is found for a selected vocabulary word.
- **FR-012**: System MUST remove the standalone history route from the primary navigation.
- **FR-013**: System MUST replace the sidebar vocabulary bank section with a passage history list for the signed-in user.
- **FR-014**: System MUST allow selecting a passage history item and navigate to that passage’s detail page.
- **FR-015**: System MUST display only the signed-in user’s own passage history items.
- **FR-016**: System MUST provide clear user-facing feedback when extraction, save, or history loading fails.

### Key Entities _(include if feature involves data)_

- **Passage Extraction Record**: A saved user-owned record containing passage title, full passage text, and extracted vocabulary list.
- **Vocabulary Item**: An extracted word entry shown in the detail page right panel and used to drive in-passage highlighting.
- **Passage History Item**: A listable summary of a prior passage extraction used for sidebar navigation to detail views.
- **User Profile Collection**: The user-scoped collection that stores passage extraction records and supports history retrieval.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: At least 95% of signed-in users successfully complete title-plus-passage submission on their first attempt.
- **SC-002**: At least 95% of successful extractions are saved and opened in the matching detail page within 5 seconds of submission completion.
- **SC-003**: At least 98% of history item selections open the correct passage detail page on first navigation.
- **SC-004**: At least 95% of vocabulary-word selections produce correct visible highlighting behavior for matching in-passage terms.
- **SC-005**: At least 90% of users with prior activity can locate and open a previously extracted passage from the sidebar in under 15 seconds.
- **SC-006**: 0 confirmed incidents of users seeing passage history items owned by another user.

## Assumptions

- Users are already authenticated before entering the dashboard extraction flow.
- Existing extraction quality rules for vocabulary relevance continue to apply and are not redefined by this feature.
- Passage history entries are based on successful extraction-save outcomes only.
- The detail page route pattern already exists and can address a specific saved passage record.
- The feature targets web usage on modern desktop and mobile browsers.
