# Tasks: Vocabulary Extraction & History Flow

**Input**: Design documents from /specs/002-vocabulary-history-flow/

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/extraction-history-flow-api.md

**Tests**: No automated tests. This project uses lint-only quality gate per constitution.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare route scaffolding and shared client contracts for the new flow.

- [x] T001 Define extraction request/response types for title+passage submission in lib/query-hooks/extraction.ts
- [x] T002 [P] Create detail route folder and base page shell in app/dashboard/passages/[recordId]/page.tsx
- [x] T003 [P] Add route-level loading and error UI for passage detail in app/dashboard/passages/[recordId]/loading.tsx and app/dashboard/passages/[recordId]/error.tsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement shared data contracts and API foundations required by all stories.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [x] T004 Extend extraction input validation to require title and passage in lib/openrouter/extraction-schema.ts
- [x] T005 [P] Add Firestore helpers for storing and reading full passage extraction records in lib/firebase/firestore-service.ts
- [x] T006 [P] Update extract endpoint contract handling for recordId/title/passage/vocabularyList in app/api/extract/route.ts
- [x] T007 [P] Add detail-fetch endpoint query validation for recordId in app/api/vocabulary/route.ts
- [x] T008 Update profile-history endpoint response fields for recordId/title history items in app/api/profile/history/route.ts
- [x] T009 Add shared history/detail client types for record-centric navigation in lib/query-hooks/history.ts

**Checkpoint**: Core contracts and storage primitives are ready for story implementation.

---

## Phase 3: User Story 1 - Extract Passage Vocabulary (Priority: P1) 🎯 MVP

**Goal**: Submit title+passage, save extraction record, and navigate automatically to detail page.

**Independent Test**: Submit with both inputs, confirm saved record, and verify redirect to matching detail route.

- [x] T010 [US1] Add title input state, rendering, and required-field validation in app/dashboard/page.tsx
- [x] T011 [US1] Send title+passage payload in extraction mutation request body in lib/query-hooks/extraction.ts
- [x] T012 [US1] Persist title, full passage, and vocabularyList as one user-owned record in lib/firebase/firestore-service.ts
- [x] T013 [US1] Wire app/api/extract/route.ts to save new record shape and return recordId for navigation in app/api/extract/route.ts
- [x] T014 [US1] Redirect dashboard submit success flow to /dashboard/passages/[recordId] in app/dashboard/page.tsx
- [x] T015 [US1] Surface extraction/save failure feedback for blocked redirect states in app/dashboard/extraction-status.tsx
- [x] T016 [US1] Ensure empty-vocabulary successful extractions are still saved and navigable in app/dashboard/extraction-result.tsx

**Checkpoint**: User Story 1 is functional and can be validated independently.

---

## Phase 4: User Story 2 - Review Passage And Vocabulary Together (Priority: P2)

**Goal**: Show two-panel detail view and support click-to-highlight vocabulary context.

**Independent Test**: Open detail route for a saved record, click vocabulary words, and verify passage highlights or no-match feedback.

- [x] T017 [US2] Implement user-scoped record detail retrieval by recordId in lib/firebase/firestore-service.ts
- [x] T018 [US2] Return passage detail payload (title, passage, vocabularyList) in app/api/vocabulary/route.ts
- [x] T019 [P] [US2] Build two-panel detail container and data loading flow in app/dashboard/passages/[recordId]/page.tsx
- [x] T020 [P] [US2] Create passage panel component with highlighted-range rendering in app/dashboard/passages/[recordId]/passage-panel.tsx
- [x] T021 [P] [US2] Create selectable vocabulary list panel component in app/dashboard/passages/[recordId]/vocabulary-panel.tsx
- [x] T022 [US2] Implement case-insensitive, punctuation-tolerant highlight range utility in app/dashboard/passages/[recordId]/highlight-utils.ts
- [x] T023 [US2] Connect word selection to highlight state and no-match feedback in app/dashboard/passages/[recordId]/page.tsx

**Checkpoint**: User Story 2 works end-to-end on top of saved passage records.

---

## Phase 5: User Story 3 - Access Passage History From Sidebar (Priority: P3)

**Goal**: Replace vocabulary-bank sidebar content with passage history and remove history route from navigation.

**Independent Test**: From dashboard, view passage history list and open detail page by clicking an item; confirm History is removed from nav menu.

- [x] T024 [US3] Remove History entry from dashboard navigation dropdown in app/dashboard/layout.tsx
- [x] T025 [US3] Replace dashboard Vocabulary Bank block with Passage History list UI in app/dashboard/vocabulary-list.tsx
- [x] T026 [US3] Return title-aware history items suitable for sidebar navigation in lib/firebase/firestore-service.ts
- [x] T027 [US3] Update history query hook selectors for sidebar passage records in lib/query-hooks/history.ts
- [x] T028 [US3] Wire history-item click navigation to /dashboard/passages/[recordId] in app/dashboard/vocabulary-list.tsx
- [x] T029 [US3] Update legacy history panel list items to link into detail routes in app/dashboard/history/history-panel.tsx

**Checkpoint**: User Story 3 supports passage-centric revisit flow from dashboard navigation.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening and validation across all stories.

- [x] T030 [P] Handle missing/deleted passage records with clear recovery action in app/dashboard/passages/[recordId]/page.tsx
- [x] T031 [P] Refine user-facing failure copy for extraction/save/history/detail errors in app/dashboard/extraction-status.tsx
- [x] T032 [P] Align manual validation checklist with implemented UI flow in specs/002-vocabulary-history-flow/quickstart.md
- [x] T033 Resolve lint blocker and re-run quality gate for changed files in app/dashboard/layout.tsx

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 (Setup): Start immediately.
- Phase 2 (Foundational): Depends on Phase 1 and blocks all story work.
- Phase 3 (US1): Depends on Phase 2.
- Phase 4 (US2): Depends on Phase 2 and can proceed after record APIs are stable.
- Phase 5 (US3): Depends on Phase 2 and can proceed after history payload updates.
- Phase 6 (Polish): Depends on completion of selected user stories.

### User Story Dependencies

- US1 (P1): No dependency on other stories after foundational phase.
- US2 (P2): No strict dependency on US1 code path if record data exists, but naturally complements US1 output.
- US3 (P3): No strict dependency on US2; depends on history data contract from foundational work.

### Within Each User Story

- API and data helpers before UI wiring.
- Route data loading before interaction features.
- Complete story acceptance flow before moving on.

## Parallel Opportunities

- Setup parallel tasks: T002, T003
- Foundational parallel tasks: T005, T006, T007
- US2 parallel UI tasks: T019, T020, T021
- Polish parallel tasks: T030, T031, T032

## Parallel Example: User Story 1

- Run T010 and T011 in parallel (dashboard form and mutation payload updates).
- Run T012 and T013 sequentially after foundational API contracts are stable.
- Complete T014, T015, and T016 after backend response includes recordId.

## Parallel Example: User Story 2

- Run T020 and T021 in parallel after T019 defines page data flow.
- Run T022 in parallel with T020/T021, then finish integration in T023.

## Parallel Example: User Story 3

- Run T024 and T026 in parallel (navigation cleanup and history data shaping).
- Run T025 and T027 in parallel, then complete click-through integration in T028.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1).
3. Validate submission, save, and redirect behavior.
4. Demo/deploy MVP.

### Incremental Delivery

1. Deliver US1 for extraction and redirect.
2. Deliver US2 for contextual detail study.
3. Deliver US3 for passage-history-first navigation.
4. Finish polish tasks and lint gate.
