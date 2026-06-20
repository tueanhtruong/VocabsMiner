# Feature Specification: Word Action Menu

**Feature Branch**: `[003-word-action-menu]`

**Created**: 2026-06-20

**Status**: Draft

**Input**: User description: "In the passage detail view, when a user selects a word in the left-side passage panel, show a popup menu with two actions: translate the selected word to Vietnamese, and generate a vocabulary draft that pre-fills the add-new-vocabulary form so the user can save it later."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Translate Selected Word (Priority: P1)

As a learner reviewing a passage, I can select a word in the passage and immediately see a Vietnamese translation action in a popup menu so I can understand the word without leaving the detail view.

**Why this priority**: Quick translation is the fastest path to immediate reading support and gives the feature direct everyday value.

**Independent Test**: Can be fully tested by opening a passage detail view, selecting a word, confirming a popup menu appears, and confirming the first menu action shows the Vietnamese translation.

**Acceptance Scenarios**:

1. **Given** a passage detail view is open, **When** the learner selects a word in the passage panel, **Then** a popup menu appears anchored to the selection.
2. **Given** the popup menu is visible, **When** the learner chooses the translation action, **Then** the selected word is translated into Vietnamese and the result is shown in the menu.
3. **Given** the selected word cannot be translated, **When** the learner opens the translation action, **Then** the menu shows a clear failure message and the user remains on the same passage detail view.

---

### User Story 2 - Pre-Fill Vocabulary Draft (Priority: P2)

As a learner, I can use the selected-word popup menu to generate a vocabulary draft so the add-new-vocabulary form is pre-filled with useful information and I can save it later if I want.

**Why this priority**: Draft generation reduces manual entry and turns an interesting word into a saved vocabulary item with less effort.

**Independent Test**: Can be fully tested by selecting a word, choosing the draft-generation action, verifying the add vocabulary form is populated, and confirming the user can edit or save the draft later.

**Acceptance Scenarios**:

1. **Given** a passage detail view is open and a word is selected, **When** the learner chooses the vocabulary draft action, **Then** the system prepares a new vocabulary draft from the selected word.
2. **Given** a vocabulary draft has been generated, **When** the add-new-vocabulary form opens, **Then** the form contains pre-filled fields derived from the selected word.
3. **Given** the form already contains user-entered edits, **When** new draft data arrives, **Then** the user’s existing edits are not lost.

---

### User Story 3 - Keep Selection Flow Stable (Priority: P3)

As a learner, I can dismiss the popup menu and continue reviewing the passage so the selection tool feels predictable and does not interrupt reading.

**Why this priority**: Stable interaction is necessary so the popup supports study instead of becoming a distraction.

**Independent Test**: Can be fully tested by selecting different words, dismissing the popup, and confirming the detail view remains usable without losing the current passage context.

**Acceptance Scenarios**:

1. **Given** the popup menu is visible, **When** the learner clicks outside it, **Then** the popup closes without changing the passage detail view.
2. **Given** the learner selects a different word, **When** the new selection is made, **Then** the popup updates to reflect the new word.
3. **Given** the learner dismisses the popup after an action, **When** they continue reading, **Then** the passage and vocabulary list remain visible and unchanged.

### Edge Cases

- What happens when the learner selects punctuation, a phrase, or a word split across lines?
- How does the popup behave when the selected text is already part of an existing vocabulary item?
- What happens when translation generation fails or returns no result?
- How does the form behave when draft generation returns partial information only?
- What happens when the learner changes selection before a previous action completes?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST show a contextual popup menu when the learner selects text in the passage panel of the detail view.
- **FR-002**: System MUST present the Vietnamese translation action as the first menu option.
- **FR-003**: System MUST display a Vietnamese translation for the selected text when the translation action is activated.
- **FR-004**: System MUST keep the learner on the same passage detail view while translation is being shown.
- **FR-005**: System MUST present a vocabulary draft action in the popup menu for the selected text.
- **FR-006**: System MUST populate the add-new-vocabulary form with draft data derived from the selected text when the vocabulary draft action is activated.
- **FR-007**: System MUST preserve any user-entered form values that already exist when new draft data is applied.
- **FR-008**: System MUST allow the learner to review and edit the pre-filled vocabulary draft before saving it.
- **FR-009**: System MUST provide clear user-facing feedback when translation or draft generation fails.
- **FR-010**: System MUST allow the learner to dismiss the popup menu without losing the current passage context.
- **FR-011**: System MUST support repeated word selection within the same detail view session.

### Key Entities _(include if feature involves data)_

- **Selected Word**: The passage text the learner highlights for translation or vocabulary drafting.
- **Translation Preview**: The Vietnamese translation shown to the learner for the selected word.
- **Vocabulary Draft**: A pre-filled set of vocabulary form values generated from the selected word.
- **Add Vocabulary Form**: The user-editable form used to review and save a vocabulary item.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: At least 95% of valid word selections show the popup menu immediately enough for users to continue reading without noticeable interruption.
- **SC-002**: At least 90% of translation actions display a Vietnamese result within 3 seconds of selection.
- **SC-003**: At least 90% of vocabulary draft actions pre-fill the add-new-vocabulary form with the available fields from the selected word.
- **SC-004**: At least 95% of users who trigger either action can complete the flow without leaving the passage detail view.
- **SC-005**: 0 confirmed incidents of the popup action clearing the current passage context or replacing it with unrelated content.

## Assumptions

- The passage detail view already shows the passage on the left and the vocabulary list on the right.
- The add-new-vocabulary form already exists and can receive pre-filled values from a selected word.
- The first release focuses on a single selected word at a time rather than bulk selection.
- Vietnamese is the only translation target for this feature release.
- Saving the generated vocabulary draft remains a separate user decision and is not automatic.
