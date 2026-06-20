# Tasks: Word Action Menu

**Input**: Design documents from `/specs/003-word-action-menu/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Tests**: No test tasks included. The constitution requires lint-only validation.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the external translation dependency needed by the new popup action.

- [x] T001 Add `@vitalets/google-translate-api` to `package.json` and refresh `pnpm-lock.yaml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define shared request/response shapes that both popup actions will use.

**Checkpoint**: Foundation ready - user story implementation can now begin.

- [x] T002 Create shared word-action types in `lib/word-actions/types.ts` for selected-word input, translation output, and vocabulary draft payloads

---

## Phase 3: User Story 1 - Translate Selected Word (Priority: P1) 🎯 MVP

**Goal**: Let the learner select a word in the passage and see a popup menu whose first action translates the selected word to Vietnamese.

**Independent Test**: Open a passage detail page, select a word in the left panel, and confirm the popup appears with a Vietnamese translation action that shows the translated text without leaving the page.

### Implementation for User Story 1

- [x] T003 Add the server translation helper in `lib/word-actions/translate.ts` using `@vitalets/google-translate-api` and normalize the Vietnamese result
- [x] T004 Add `app/api/word-actions/translate/route.ts` to validate the selected word request and return the translation response
- [x] T005 Update `app/dashboard/passages/[recordId]/page.tsx` to manage selected-word popup state, translation loading/result state, and popup close/reset behavior
- [x] T006 Update `app/dashboard/passages/[recordId]/passage-panel.tsx` to open the contextual popup from text selection and render Vietnamese translation as the first menu option

**Checkpoint**: User Story 1 should now be independently functional and usable as the MVP slice.

---

## Phase 4: User Story 2 - Pre-Fill Vocabulary Draft (Priority: P2)

**Goal**: Let the learner generate a vocabulary draft from the selected word and open the existing add-new-vocabulary form prefilled with useful information.

**Independent Test**: Select a word, choose the draft action, and confirm the add vocabulary dialog opens with draft values populated while still allowing manual edits before saving.

### Implementation for User Story 2

- [x] T007 Add the OpenRouter draft helper in `lib/word-actions/draft.ts` to generate a structured vocabulary draft from the selected word and passage context
- [x] T008 Add `app/api/word-actions/draft/route.ts` to validate the draft request and return the draft payload
- [x] T009 Update `app/dashboard/passages/[recordId]/page.tsx` to request a vocabulary draft when the second popup action is chosen and pass the result to the form flow
- [x] T010 Update `app/dashboard/passages/[recordId]/vocabulary-panel.tsx` to accept generated draft values and merge them into the add-new-vocabulary form without losing existing edits

**Checkpoint**: User Stories 1 and 2 should now work together, with translation and draft generation both available from the passage detail view.

---

## Phase 5: User Story 3 - Keep Selection Flow Stable (Priority: P3)

**Goal**: Keep the popup interaction predictable so the learner can dismiss it, change selection, and continue reading without losing passage context.

**Independent Test**: Select different words, dismiss the popup, and confirm the detail view remains stable with the current passage still visible and usable.

### Implementation for User Story 3

- [x] T011 Update `app/dashboard/passages/[recordId]/passage-panel.tsx` to support outside-click and Escape dismissal plus repeated word selection updates for the popup
- [x] T012 Update `app/dashboard/passages/[recordId]/page.tsx` to clear stale translation and draft state when the popup is dismissed or a new word is selected

**Checkpoint**: All three user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, validation, and documentation alignment across the new flow.

- [x] T013 Run `pnpm lint` and fix any issues in `app/dashboard/passages/[recordId]/page.tsx`, `app/dashboard/passages/[recordId]/passage-panel.tsx`, `app/dashboard/passages/[recordId]/vocabulary-panel.tsx`, `app/api/word-actions/translate/route.ts`, `app/api/word-actions/draft/route.ts`, `lib/word-actions/translate.ts`, and `lib/word-actions/draft.ts`
- [x] T014 Update `specs/003-word-action-menu/quickstart.md` and `README.md` with the finalized selected-word translation and draft-prefill flow

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion and blocks all user stories.
- **User Stories (Phase 3+)**: Depend on the foundational types being available.
- **Polish (Final Phase)**: Depends on the implemented user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 and delivers the MVP translation popup.
- **User Story 2 (P2)**: Can start after Phase 2 and builds on the same popup interaction to prefill the vocabulary form.
- **User Story 3 (P3)**: Can start after Phase 2 and stabilizes the popup flow without changing the core features.

### Within Each User Story

- Shared helpers before API routes when a route imports the helper.
- Page state before component wiring that consumes the state.
- Popup interaction before polish and docs updates.

### Parallel Opportunities

- T002 can be prepared independently after setup.
- T003 and T004 can be split across two contributors once the shared types exist, but the route should import the helper before merge.
- T007 and T008 can be split across two contributors once the shared types exist, but the route should import the helper before merge.
- T011 and T012 touch different files and can be worked on in parallel once the draft and translation flows are in place.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. Validate the popup translation flow in the passage detail view.

### Incremental Delivery

1. Deliver the translation popup first so users can immediately understand selected words.
2. Add the draft-prefill action next so users can turn selected words into reusable vocabulary entries.
3. Finish with the stability work so the popup feels predictable across repeated selections and dismissals.

### Parallel Team Strategy

1. One developer can own the server translation route while another wires the popup UI.
2. One developer can build the OpenRouter draft helper while another updates the vocabulary form to accept prefills.
3. One developer can harden selection dismissal behavior while another finalizes lint and docs cleanup.

---

## Notes

- [P] tasks = different files, no dependencies.
- Each user story remains independently testable even though the feature shares the same passage detail screen.
- Keep all translation and draft generation on the server side.
