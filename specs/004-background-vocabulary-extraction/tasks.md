# Tasks: Background Vocabulary Extraction

**Input**: Design documents from `/specs/004-background-vocabulary-extraction/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/background-extraction-api.md, quickstart.md

**Tests**: No automated test tasks are included because the project constitution prohibits test infrastructure; every implementation task must be followed by `pnpm lint`.

**Organization**: Tasks are grouped by user story. Shared status and worker infrastructure is completed first so each story uses the same durable Firestore contract.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the Firebase Functions project surface required for durable extraction.

- [x] T001 Create the Firebase Functions package manifest with Node.js 20-compatible Firebase Functions, Firebase Admin, OpenRouter client, and TypeScript dependencies in `functions/package.json`
- [x] T002 [P] Create Firebase Functions TypeScript compiler configuration targeting the deployed Node.js runtime in `functions/tsconfig.json`
- [x] T003 [P] Add the Functions source entry point and deployment-facing export scaffold in `functions/src/index.ts`
- [x] T004 [P] Document the Functions environment variables and deployment command in `README.md`

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define durable passage states, guarded Firestore mutations, and the background worker contract before user-story UI work begins.

**Checkpoint**: Foundation ready. User story implementation can now proceed in priority order or in parallel where files do not overlap.

- [x] T005 Extend the passage history domain types with `pending`, `completed`, and `error` status fields, sanitized error reason, and internal attempt claim metadata in `lib/firebase/firestore-service.ts`
- [x] T006 Implement pending passage creation that stores an empty vocabulary list, zero count, status, timestamps, and immutable user ownership in `lib/firebase/firestore-service.ts`
- [x] T007 Implement transactional attempt claim and claim-token-guarded completion/error finalization helpers in `lib/firebase/firestore-service.ts`
- [x] T008 [P] Implement sanitized OpenRouter/provider error mapping for background worker failures in `functions/src/extraction-worker.ts`
- [x] T009 Implement the Firestore passage trigger that claims pending records, runs the existing vocabulary extraction logic, updates vocabulary/profile persistence on success, and records sanitized errors on failure in `functions/src/extraction-worker.ts`
- [x] T010 Export the configured passage trigger from `functions/src/index.ts` and verify its watched document path matches `users/{uid}/passages/{recordId}`
- [x] T011 [P] Update Firestore rules or deployment configuration documentation to preserve authenticated user isolation and prevent client access to internal attempt metadata in `firebase/firestore.rules`

## Phase 3: User Story 1 - Submit Without Blocking (Priority: P1) 🎯 MVP

**Goal**: Save a valid passage immediately as `pending`, return a usable response, and remove the app-wide extraction blocker.

**Independent Test**: With a delayed extraction provider, submit a valid passage, confirm the same passage appears in history as pending with zero words, and navigate to another dashboard view before extraction completes.

### Implementation for User Story 1

- [x] T012 [US1] Refactor `POST /api/extract` to validate input, create the pending passage record, and return the contract response without awaiting vocabulary extraction in `app/api/extract/route.ts`
- [x] T013 [P] [US1] Update the extraction response and mutation types to represent `pending`, empty vocabulary, and immediate persistence in `lib/query-hooks/extraction.ts`
- [x] T014 [US1] Remove the full-page extraction overlay and navigate after the pending response is received in `app/dashboard/page.tsx`
- [x] T015 [P] [US1] Add pending-state copy and zero-result handling to the dashboard extraction result surface in `app/dashboard/extraction-result.tsx`
- [x] T016 [US1] Ensure invalid title or passage input remains rejected before record creation and displays the existing actionable validation state in `app/dashboard/page.tsx`
- [x] T017 [US1] Confirm the dashboard submission flow leaves the user on a usable route after the pending record response and does not disable unrelated navigation in `app/dashboard/page.tsx`

**Checkpoint**: A valid submission creates one pending history record quickly and does not block the application while the Firebase worker processes it.

## Phase 4: User Story 2 - Monitor Completed Extraction (Priority: P2)

**Goal**: Expose durable status changes and make completed vocabulary available after the user leaves and returns to the app.

**Independent Test**: Submit a passage, leave the submission view, allow the worker to finish, then refresh history and open detail to verify `completed` status and the extracted vocabulary.

### Implementation for User Story 2

- [x] T018 [P] [US2] Add status, sanitized error reason when applicable, and status-consistent vocabulary count to history API passage items in `app/api/profile/history/route.ts`
- [x] T019 [P] [US2] Add status-aware passage history and sidebar types while preserving the shared history query cache in `lib/query-hooks/history.ts`
- [x] T020 [US2] Render pending and completed status indicators and status-consistent word counts in `app/dashboard/history/history-panel.tsx`
- [x] T021 [P] [US2] Include status, error reason, and vocabulary count in the passage detail API response from `lib/firebase/firestore-service.ts`
- [x] T022 [US2] Update the passage detail query response type and render pending/completed states without showing incomplete vocabulary actions in `app/dashboard/passages/[recordId]/page.tsx`
- [x] T023 [US2] Add detail-query refresh behavior that polls only while the record is pending and stops when it becomes completed or error in `app/dashboard/passages/[recordId]/page.tsx`
- [x] T024 [US2] Keep vocabulary aggregate upserts and passage vocabulary counts consistent when the worker completes with a non-empty or zero-item result in `functions/src/extraction-worker.ts`

**Checkpoint**: History and detail can be revisited independently of the original submission, and successful or empty extractions settle as `completed` with the correct list/count.

## Phase 5: User Story 3 - Recover From Extraction Failure (Priority: P2)

**Goal**: Preserve failed passages, show a useful error state, and restart extraction safely through one authenticated retry operation.

**Independent Test**: Cause a provider failure, open the saved passage, verify its error reason and Retry action, select Retry, and confirm the same record returns to pending without duplicate active work.

### Implementation for User Story 3

- [x] T025 [P] [US3] Implement an authenticated retry Firestore mutation that transactionally resets only an error record to pending, clears stale vocabulary/error/claim fields, and preserves title/content/createdAt in `lib/firebase/firestore-service.ts`
- [x] T026 [US3] Add `POST /api/extract/retry` request validation, owner-scoped lookup, idempotent pending handling, and error responses in `app/api/extract/retry/route.ts`
- [x] T027 [P] [US3] Add the retry mutation and cache invalidation for passage detail and history queries in `lib/query-hooks/extraction.ts`
- [x] T028 [US3] Render the saved passage error state, sanitized reason, and Retry action in `app/dashboard/passages/[recordId]/page.tsx`
- [x] T029 [US3] Disable duplicate retry submissions, refresh the record to pending after success, and preserve navigation while the new worker attempt runs in `app/dashboard/passages/[recordId]/page.tsx`
- [x] T030 [US3] Ensure worker finalization ignores stale claim tokens so an older attempt cannot overwrite a newer retry result in `functions/src/extraction-worker.ts`
- [x] T031 [US3] Expose error status and sanitized error reason in history while keeping failed records linkable and vocabulary count at zero in `app/dashboard/history/history-panel.tsx`

**Checkpoint**: A failed extraction remains recoverable, retry is owner-scoped and idempotent, and stale background work cannot replace a newer retry.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Align documentation, operational validation, and quality gates across the complete feature.

- [x] T032 [P] Update API endpoint and user-flow documentation for pending extraction, status states, and retry behavior in `README.md`
- [x] T033 [P] Add the Functions package to the workspace/deployment configuration and verify production environment variable names in `pnpm-workspace.yaml` and `firebase.json`
- [ ] T034 Run the delayed-provider, browser-close, zero-vocabulary, duplicate-retry, and user-isolation scenarios from `specs/004-background-vocabulary-extraction/quickstart.md`
- [x] T035 Run `pnpm lint` from the repository root and resolve all errors before marking the feature complete
- [x] T036 Verify the final implementation against every acceptance scenario and functional requirement in `specs/004-background-vocabulary-extraction/spec.md`

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; T001-T004 can begin immediately, with T002-T004 parallel where needed.
- **Foundational (Phase 2)**: Depends on Setup completion. T005-T011 block all user-story work because every story depends on the shared status model and durable worker.
- **User Story 1 (Phase 3)**: Depends on Phase 2 and is the MVP slice.
- **User Story 2 (Phase 4)**: Depends on T012 and T022's shared response shape; it can begin after the foundational phase, but completion validation depends on the pending submission contract.
- **User Story 3 (Phase 5)**: Depends on T005-T010 and the status-bearing detail response; T025-T031 should follow the completion/status shape from US2.
- **Polish (Phase 6)**: Depends on all desired user stories being implemented.

### User Story Dependencies

- **US1 (P1)**: Depends only on the Foundational phase; delivers the MVP independently.
- **US2 (P2)**: Depends on the shared worker and pending record contract from the Foundational phase, plus the immediate response shape from US1.
- **US3 (P2)**: Depends on the shared claim/status helpers and the status-aware detail/history surfaces; it extends US2's error presentation but does not require a new persistence model.

### Parallel Opportunities

- T002, T003, and T004 can proceed in parallel after T001 defines the Functions package.
- T008 and T011 can proceed in parallel with the initial data-model work in T005-T007.
- Within US1, T013 and T015 can proceed in parallel; T012 must land before final UI wiring in T014 and T017.
- Within US2, T018, T019, and T021 can proceed in parallel; T020 follows T018/T019, while T022-T023 follow T021.
- Within US3, T025, T027, and T031 can proceed in parallel after the shared status contract exists; T026 follows T025 and T028-T029 follow T026/T027.
- T032 and T033 can proceed in parallel with final manual validation, while T035 follows all source edits.

## Parallel Example: User Story 1

```text
Task: T013 [US1] Update extraction response and mutation types in lib/query-hooks/extraction.ts
Task: T015 [US1] Add pending-state rendering in app/dashboard/extraction-result.tsx

After T012:
Task: T014 [US1] Remove the blocking overlay and navigate after pending response in app/dashboard/page.tsx
Task: T017 [US1] Verify usable navigation after pending response in app/dashboard/page.tsx
```

## Parallel Example: User Story 2

```text
Task: T018 [US2] Add status fields to history API items in app/api/profile/history/route.ts
Task: T019 [US2] Add status-aware history query types in lib/query-hooks/history.ts
Task: T021 [US2] Add status fields to passage detail data in lib/firebase/firestore-service.ts
```

## Parallel Example: User Story 3

```text
Task: T025 [US3] Implement the guarded retry mutation in lib/firebase/firestore-service.ts
Task: T027 [US3] Add the retry mutation hook and cache invalidation in lib/query-hooks/extraction.ts
Task: T031 [US3] Render error status in app/dashboard/history/history-panel.tsx
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational worker and status model.
3. Complete Phase 3: User Story 1.
4. Run `pnpm lint` and the pending/delayed-provider quickstart scenarios.
5. Stop for MVP validation: users can submit immediately, see a pending record, and continue navigating.

### Incremental Delivery

1. Complete Setup + Foundational so durable processing and ownership rules are established.
2. Add US1 and validate non-blocking submission.
3. Add US2 and validate history/detail completion visibility.
4. Add US3 and validate error recovery and duplicate retry protection.
5. Complete polish, deployment, quickstart validation, and the final lint gate.

### Parallel Team Strategy

1. One contributor completes Setup + Foundational together because the worker and Firestore model define the shared contract.
2. After the foundation:
   - Contributor A: US1 API and dashboard submission flow.
   - Contributor B: US2 history/detail status visibility.
   - Contributor C: US3 retry API and error recovery UI.
3. Integrate each story at its checkpoint and run `pnpm lint` after each logical task group.

## Notes

- Every task starts with `- [ ]`, has a sequential ID, and includes a concrete file path.
- `[P]` marks only tasks that can work on different files without incomplete-task dependencies.
- No automated test files are planned; manual scenarios and `pnpm lint` are the project quality gates.
