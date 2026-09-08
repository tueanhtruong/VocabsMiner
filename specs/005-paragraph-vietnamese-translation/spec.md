# Feature Specification: Paragraph-Level Vietnamese Translation & Management

**Feature Branch**: `005-paragraph-vietnamese-translation`

**Created**: 2026-09-03

**Status**: Draft

**Input**: User description: "Integrate paragraph-level Vietnamese translation into Vocab Miner, including collapsible display, AI generation for new passages, and manual and AI management for existing passages."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Read Paragraph Translations (Priority: P1)

As a Vocab Miner learner, I want to expand a translation beneath a specific paragraph so that I can compare the Vietnamese meaning with the original text without losing my place.

**Why this priority**: Showing the right translation beside the right source paragraph is the core learning value and establishes the interaction used by every other translation workflow.

**Independent Test**: Open a passage that has translations for multiple paragraphs, expand each paragraph independently, and confirm that each expanded block contains only its corresponding Vietnamese translation.

**Acceptance Scenarios**:

1. **Given** a passage contains one or more paragraphs, **When** the user views the passage, **Then** each paragraph has a visible control for showing or hiding its translation.
2. **Given** a paragraph has a saved Vietnamese translation, **When** the user expands that paragraph's translation control, **Then** the corresponding translation block appears directly with that paragraph and other paragraphs remain unchanged.
3. **Given** a paragraph's translation is expanded, **When** the user collapses it, **Then** the translation block is hidden while the original paragraph remains visible and in the same reading position.
4. **Given** a passage has translations for multiple paragraphs, **When** the user expands more than one paragraph, **Then** each expanded block remains associated with the correct paragraph.

---

### User Story 2 - Generate Translations for New Passages (Priority: P1)

As a Vocab Miner learner, I want translations generated for each paragraph when I extract vocabulary from a new passage so that the passage is ready for bilingual study without requiring repetitive manual work.

**Why this priority**: Automatic generation makes paragraph translation useful at the moment a passage is first saved and avoids making learners translate an entire passage one paragraph at a time.

**Independent Test**: Submit a new multi-paragraph passage through the existing extraction flow, wait for processing to finish, and verify that each paragraph has a Vietnamese translation that can be expanded in the passage view.

**Acceptance Scenarios**:

1. **Given** a valid new passage contains multiple paragraphs, **When** the user starts the existing vocabulary extraction flow, **Then** Vietnamese translation generation is initiated for every paragraph in that passage.
2. **Given** automatic translation generation completes, **When** the user opens the passage, **Then** each source paragraph has its own saved Vietnamese translation and can display it through the paragraph control.
3. **Given** vocabulary extraction and translation generation have different completion times, **When** one process completes before the other, **Then** the passage remains usable and each completed result is available without waiting for the unrelated result.
4. **Given** automatic translation for one paragraph fails, **When** the passage is displayed, **Then** the original paragraph and any successful translations remain available, and the failed paragraph offers a recoverable option to add or generate its translation again.

---

### User Story 3 - Manage Translations Manually (Priority: P1)

As a Vocab Miner learner, I want to add, edit, and delete a paragraph translation myself so that I can correct AI output or translate passages that were saved before this feature existed.

**Why this priority**: Manual control is required for existing passages and gives learners ownership over the wording they study.

**Independent Test**: Open a passage with a missing translation, add one manually, edit it, cancel an edit, and delete it; verify the paragraph moves through each expected state without changing other passage content.

**Acceptance Scenarios**:

1. **Given** a paragraph has no translation, **When** the user opens its translation section, **Then** an empty state offers Add Translation with choices to enter text manually or generate it with AI.
2. **Given** the user chooses manual translation, **When** they enter valid Vietnamese text and select Save, **Then** the text is persisted for that paragraph and is shown as its translation.
3. **Given** a paragraph has a saved translation, **When** the user selects Edit, **Then** an inline text area opens with the existing text and provides Save and Cancel controls.
4. **Given** the user changes a translation in the editor, **When** they select Cancel, **Then** the unsaved changes are discarded and the previously saved translation remains unchanged.
5. **Given** a paragraph has a saved translation, **When** the user selects Delete and confirms the action if prompted, **Then** the translation is removed and the paragraph returns to the Add Translation empty state.
6. **Given** a user saves, edits, or deletes one paragraph's translation, **When** the operation completes, **Then** translations and source text for every other paragraph remain unchanged.

---

### User Story 4 - Generate or Regenerate an Individual Translation (Priority: P2)

As a Vocab Miner learner, I want to generate a missing translation or regenerate an existing one for a single paragraph so that I can recover from a failed generation or request a fresh interpretation without affecting the passage as a whole.

**Why this priority**: Individual AI actions make the feature resilient for older passages and for translations that are incomplete or no longer useful.

**Independent Test**: Use Generate with AI on a paragraph without a translation and Regenerate on a paragraph with one, then verify loading, success, and failure outcomes are scoped to the selected paragraph.

**Acceptance Scenarios**:

1. **Given** a paragraph has no translation, **When** the user selects Generate with AI, **Then** the system requests a Vietnamese translation for that paragraph and shows progress for that paragraph only.
2. **Given** a paragraph has a saved translation, **When** the user selects Regenerate, **Then** the current translation is replaced with the newly generated Vietnamese translation after the request succeeds.
3. **Given** an AI generation request is in progress, **When** the user views the passage, **Then** the original paragraph remains readable and controls for unrelated paragraphs remain usable.
4. **Given** an AI generation request fails or returns unusable content, **When** the failure is shown, **Then** the current saved translation is preserved if one exists, the user receives an actionable error state, and the user can retry or edit manually.

### Edge Cases

- A passage with one paragraph still receives one paragraph translation and the same expand, add, edit, delete, and AI actions.
- Empty lines or formatting at the beginning or end of a passage do not create blank translation entries; paragraph association follows the paragraphs shown in the passage reader.
- A passage with no translatable paragraph content is rejected or handled by the existing passage validation and does not create a meaningless translation record.
- If a translation is missing because a passage predates this feature, the paragraph shows Add Translation rather than an error or an empty translated block.
- If a user saves whitespace-only manual text, the save is rejected with an actionable validation message and the existing translation is not overwritten.
- If a user navigates away during an add, edit, delete, or AI operation, only successfully persisted changes are retained and the passage remains recoverable on return.
- If the user submits repeated generate or regenerate actions for the same paragraph, the system prevents conflicting updates and keeps the latest successful saved result authoritative.
- If the translation service is unavailable, the passage and vocabulary results remain accessible, and the affected paragraph can be retried or managed manually later.
- A user must not see, add, edit, delete, or generate translations for a passage owned by another authenticated user.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST identify and preserve the ordered paragraphs displayed for each passage so that every translation is associated with exactly one source paragraph.
- **FR-002**: The passage reader MUST display an inline show/hide control for every paragraph, including paragraphs with and without translations.
- **FR-003**: Expanding a paragraph's translation control MUST reveal only that paragraph's Vietnamese translation and MUST leave the source text and neighboring paragraphs unchanged.
- **FR-004**: The translation section MUST provide Edit, Delete, and Regenerate actions when a saved translation exists.
- **FR-005**: During the existing new-passage vocabulary extraction flow, the system MUST initiate Vietnamese translation generation for every paragraph in the submitted passage.
- **FR-006**: The system MUST persist each successfully generated translation against its specific passage and paragraph, and MUST make it available in the passage reader after processing completes.
- **FR-007**: A translation-generation failure for one paragraph MUST NOT remove the original passage, discard successful translations for other paragraphs, or make vocabulary results unavailable.
- **FR-008**: For an existing paragraph without a translation, the system MUST show an Add Translation state with both manual entry and Generate with AI options.
- **FR-009**: Manual add and edit MUST provide an inline text area with Save and Cancel controls, and MUST reject empty or whitespace-only text.
- **FR-010**: Saving a valid manual translation MUST persist it only for the selected paragraph and immediately make it available for display.
- **FR-011**: Canceling a manual add or edit MUST discard unsaved text and preserve the last saved translation, or preserve the empty state when no translation existed.
- **FR-012**: Deleting a translation MUST remove the saved text for the selected paragraph and return that paragraph to the Add Translation state.
- **FR-013**: Generate with AI MUST create a Vietnamese translation from the selected paragraph's source text without requiring the user to leave the passage view.
- **FR-014**: Regenerate MUST replace the selected paragraph's current translation only after a new usable translation is available; a failed request MUST preserve the prior saved translation.
- **FR-015**: The system MUST show progress and actionable failure feedback for manual and AI translation operations without blocking interaction with unrelated paragraphs or vocabulary content.
- **FR-016**: Translation operations MUST preserve the passage title, source text, vocabulary, and translations for all other paragraphs.
- **FR-017**: The system MUST enforce authenticated user ownership for reading and modifying passage translations.
- **FR-018**: The system MUST prevent overlapping operations for the same paragraph from producing an ambiguous final state and MUST present one authoritative saved translation.

### Key Entities _(include if feature involves data)_

- **Passage Paragraph**: An ordered, reader-visible segment of a saved passage, identified by its parent passage and stable paragraph position or identity.
- **Paragraph Translation**: The Vietnamese text associated with one passage paragraph, including whether it is absent, available, or temporarily being generated.
- **Translation Operation**: A manual or AI action for adding, editing, deleting, generating, or regenerating one paragraph translation, with its outcome and any user-facing error state.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: In usability checks, 95% of users can reveal the Vietnamese translation for a chosen paragraph within two interactions and correctly identify which source paragraph it belongs to.
- **SC-002**: For at least 95% of successfully processed new passages, every source paragraph has a usable Vietnamese translation available within 15 seconds after translation generation finishes.
- **SC-003**: At least 90% of existing passages with missing translations can have one selected paragraph translated manually or with AI in under 60 seconds by a first-time user.
- **SC-004**: At least 95% of valid manual saves, edits, and deletes show the intended paragraph state after the next passage view or refresh, without changing another paragraph's translation.
- **SC-005**: 100% of simulated translation-service failures preserve the original passage, vocabulary results, and any previously saved translation, while exposing a retry or manual-edit path.
- **SC-006**: In usability checks, users can continue reading and using vocabulary actions for unrelated paragraphs while one paragraph translation is being generated.
- **SC-007**: 100% of authorization checks prevent a user from viewing or modifying paragraph translations belonging to another user.

## Assumptions

- The existing passage reader's paragraph boundaries are the source of truth for associating translations; this feature does not introduce a separate paragraph editing experience.
- Vietnamese is the only translation target language in this version.
- Existing authentication, passage ownership, vocabulary extraction, passage history, and passage detail workflows remain in place and are reused.
- Translation text is stored with the saved passage and remains available when the user leaves and later returns to the passage.
- Automatic translation generation may run alongside vocabulary extraction; a temporary translation failure does not invalidate an otherwise saved passage or successful vocabulary extraction.
- AI-generated translations are expected to preserve the meaning of the source paragraph, but users may always edit them manually.
- The application may show saved translations after a refresh rather than requiring real-time synchronization.
- Version one does not include translation for selected words, languages other than Vietnamese, bulk translation editing, or cancellation of an in-progress AI request.
