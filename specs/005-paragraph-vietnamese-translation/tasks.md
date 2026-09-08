---
description: "Task list for paragraph-level Vietnamese translation"
---

# Tasks: Paragraph-Level Vietnamese Translation & Management

**Input**: Design documents from `/specs/005-paragraph-vietnamese-translation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/paragraph-translation-api.md, quickstart.md

**Tests**: No automated test tasks are included because the project constitution prohibits test infrastructure. Validate each implementation task with the applicable lint command and the manual scenarios in `quickstart.md`.

**Organization**: Tasks are grouped by user story. Shared paragraph persistence, provider validation, transaction guards, and ownership rules are completed before story work begins.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the translation-specific schema and client mutation boundary used by the later story slices.

- [x] T001 [P] Add the strict `{ translation: string }` response schema and parser exports beside the existing extraction schemas in `lib/openrouter/extraction-schema.ts`
- [x] T002 [P] Add the paragraph translation query/mutation types and request helpers scaffold in `lib/query-hooks/translations.ts`
- [x] T003 [P] Document the paragraph translation endpoint, request modes, response shape, and error codes in `specs/005-paragraph-vietnamese-translation/contracts/paragraph-translation-api.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the durable paragraph model, backward compatibility, server-side AI contract, and guarded persistence operations required by every user story.

**Critical**: Complete this phase before beginning user-story implementation.

- [x] T004 Restore Firebase ID-token verification in `lib/auth/session.ts`, persist/refresh the Firebase ID token instead of the raw UID in `lib/auth/google-auth.ts`, send that token from `lib/query-hooks/api-client.ts`, and reject invalid or expired credentials before any passage lookup or mutation
- [x] T005 Define stored/public paragraph types, blank-line paragraph normalization, source hashing, deterministic paragraph IDs, and translation-state defaults in `lib/firebase/firestore-service.ts`
- [x] T006 Integrate paragraph initialization into `createPendingPassage`, add legacy-record projection/backfill for records without `paragraphs`, and expose sanitized public paragraph DTOs from `lib/firebase/firestore-service.ts`
- [x] T007 Extend `PassageDetailApiItem` and the authenticated `GET /api/vocabulary` response to return ordered public paragraphs without exposing operation claim metadata in `lib/firebase/firestore-service.ts` and `app/api/vocabulary/route.ts`
- [x] T008 Add the server-side OpenRouter paragraph translation request, strict response parsing, timeout/retry behavior, and typed provider-error mapping in `lib/openrouter/client.ts`
- [x] T009 Implement transaction-backed manual save, delete, AI claim, AI completion, and AI failure methods in `lib/firebase/firestore-service.ts`, including lease start/expiry timestamps, paragraph existence checks, same-paragraph conflict handling, operation-ID checks, sibling preservation, and failed-regeneration preservation
- [x] T010 Add transactional stale-claim recovery in `lib/firebase/firestore-service.ts` and update `firebase/firestore.rules` plus `lib/api/http.ts` so expired AI claims are reclaimable, worker metadata remains server-only, and translation conflict/provider error codes map to the API contract

**Checkpoint**: The passage document can represent ordered paragraphs for new and legacy records, the detail contract can expose them safely, and every translation mutation has a transactional owner/operation guard.

## Phase 3: User Story 1 - Read Paragraph Translations (Priority: P1) 🎯 MVP

**Goal**: Render every passage as ordered paragraph blocks with independently collapsible Vietnamese translation sections while preserving the existing word-selection and highlighting workflow on desktop and mobile.

**Independent Test**: Open a multi-paragraph passage with saved translations, expand and collapse multiple paragraphs independently, and confirm each translation remains attached to its source paragraph and the original reading position is preserved.

### Implementation for User Story 1

- [x] T011 [P] [US1] Add paragraph-aware reader props, translation display types, and per-paragraph toggle callback types in `app/dashboard/passages/[recordId]/PassagePanel/types.ts`
- [x] T012 [US1] Partition the existing passage highlight segments by normalized paragraph while preserving token click targets, selected-word ranges, and no-match behavior in `app/dashboard/passages/[recordId]/PassagePanel/utils.ts` and `app/dashboard/passages/[recordId]/PassagePanel/PassageText.tsx`
- [x] T013 [US1] Create the paragraph translation display component with an accessible show/hide control, available translation block, and empty-state placeholder in `app/dashboard/passages/[recordId]/PassagePanel/ParagraphTranslation.tsx`
- [x] T014 [US1] Render ordered paragraph containers and independent expansion state in `app/dashboard/passages/[recordId]/PassagePanel/PassageText.tsx`
- [x] T015 [US1] Pass paragraph data and translation display callbacks through the shared panel while retaining selected-word, vocabulary-draft, and highlight behavior in `app/dashboard/passages/[recordId]/PassagePanel/index.tsx`
- [x] T016 [US1] Preserve the paragraph-aware panel contract through the mobile reader path in `app/dashboard/passages/[recordId]/PassageDrawer.tsx`
- [x] T017 [US1] Extend the passage detail response type and query rendering to consume ordered paragraphs while retaining the raw passage field for existing word actions in `app/dashboard/passages/[recordId]/page.tsx`

**Checkpoint**: A saved passage is readable as paragraph blocks, every paragraph has an independent translation toggle, and desktop/mobile behavior remains shared and consistent.

## Phase 4: User Story 2 - Generate Translations for New Passages (Priority: P1)

**Goal**: Start independent Vietnamese translation generation for every paragraph during new-passage extraction, persist partial results, and keep vocabulary extraction usable when translation work is slow or fails.

**Independent Test**: Submit a new passage with at least three paragraphs, leave the submission view, and verify that vocabulary and paragraph translations settle independently; a failed paragraph remains retryable without removing successful results.

### Implementation for User Story 2

- [x] T018 [US2] Include initialized paragraph count/state in the accepted new-passage response without delaying the pending response in `app/api/extract/route.ts`
- [x] T019 [US2] Make Firebase Functions the sole automatic production owner and gate `dispatchPassageExtraction` so accidental Next.js/Firebase overlap becomes a no-op in `functions/src/index.ts`, `app/api/extract/route.ts`, and `lib/api/extraction-dispatch.ts`
- [x] T020 [US2] Keep the Next.js processing path as an explicit local/manual fallback with independent per-paragraph orchestration, partial-result persistence, and translation failures isolated from vocabulary completion in `app/api/extract/process/route.ts`
- [x] T021 [US2] Add worker-local paragraph normalization compatibility, strict translation response parsing, OpenRouter request handling, and sanitized translation errors to the durable Firebase processor in `functions/src/extraction-worker.ts`
- [x] T022 [US2] Start bounded per-paragraph translation generation from the durable pending-passage worker, use idempotent paragraph claims, and finalize each result without changing passage-level vocabulary status or clearing paragraph data in `functions/src/extraction-worker.ts`
- [x] T023 [US2] Refresh the single passage-detail query while any paragraph is generating and stop polling when no paragraph remains in a generating state in `app/dashboard/passages/[recordId]/page.tsx`
- [x] T024 [US2] Show partial translation availability and paragraph-local generation failures while keeping vocabulary content and the source passage usable in `app/dashboard/passages/[recordId]/PassagePanel/ParagraphTranslation.tsx`

**Checkpoint**: New passages receive independent paragraph translation work through both processing paths, partial success is durable, and translation failures do not change vocabulary extraction status.

## Phase 5: User Story 3 - Manage Translations Manually (Priority: P1)

**Goal**: Let users add, edit, cancel, and delete one paragraph translation at a time, including for legacy passages, without modifying neighboring paragraphs or vocabulary.

**Independent Test**: On a passage with a missing translation, add valid Vietnamese text, edit it, cancel an unsaved edit, delete it, and refresh to confirm the selected paragraph state persists and all other passage data is unchanged.

### Implementation for User Story 3

- [x] T025 [US3] Implement authenticated manual-add validation and persistence for `POST /api/translations` using the owner-scoped Firestore service in `app/api/translations/route.ts`
- [x] T026 [US3] Implement authenticated manual-edit and delete handling for `PUT` and `DELETE /api/translations`, including whitespace rejection, missing-paragraph errors, generating conflicts, and stable response DTOs in `app/api/translations/route.ts`
- [x] T027 [US3] Implement manual add/edit/delete mutation functions, optimistic or response-based paragraph cache updates, and detail-query invalidation using the existing request client in `lib/query-hooks/translations.ts`
- [x] T028 [US3] Add inline manual editor state with Add Translation, text area, Save, Cancel, validation error, and saved-value restoration behavior in `app/dashboard/passages/[recordId]/PassagePanel/ParagraphTranslation.tsx`
- [x] T029 [US3] Add Delete action and confirmation handling that returns the selected paragraph to the missing state without affecting sibling paragraphs in `app/dashboard/passages/[recordId]/PassagePanel/ParagraphTranslation.tsx`
- [x] T030 [US3] Wire manual translation callbacks from the passage detail page into the shared desktop/mobile panel and update the `passage-detail` cache only for the selected paragraph in `app/dashboard/passages/[recordId]/page.tsx`
- [x] T031 [US3] Keep manual mutation loading and error feedback local to the selected paragraph while leaving unrelated reading and vocabulary actions enabled in `app/dashboard/passages/[recordId]/PassagePanel/index.tsx`

**Checkpoint**: Existing and newly generated passages support durable manual paragraph CRUD, cancellation is non-destructive, and one paragraph cannot overwrite another.

## Phase 6: User Story 4 - Generate or Regenerate an Individual Translation (Priority: P2)

**Goal**: Provide paragraph-local Generate with AI and Regenerate actions with guarded operation claims, progress, retryable errors, and preservation of the previous translation on failed regeneration.

**Independent Test**: Generate a missing paragraph and regenerate an available paragraph while using unrelated paragraph controls; verify success, failure, loading, and stale-response behavior are scoped to the selected paragraph.

### Implementation for User Story 4

- [x] T032 [US4] Add AI generate mode to `POST /api/translations` and AI regenerate mode to `PUT /api/translations`, claiming the paragraph before calling OpenRouter and finalizing only the matching operation ID in `app/api/translations/route.ts`
- [x] T033 [US4] Map provider, conflict, and stale-operation failures to the paragraph translation API contract while preserving a previous translation on failed regeneration in `app/api/translations/route.ts`
- [x] T034 [US4] Add Generate with AI and Regenerate mutation functions with paragraph-keyed loading/error state and detail-cache refresh behavior in `lib/query-hooks/translations.ts`
- [x] T035 [US4] Render Generate with AI, Regenerate, paragraph-local progress, retryable failure feedback, and preserved prior text in `app/dashboard/passages/[recordId]/PassagePanel/ParagraphTranslation.tsx`
- [x] T036 [US4] Disable conflicting same-paragraph controls during an active operation while leaving unrelated paragraph controls and vocabulary actions usable in `app/dashboard/passages/[recordId]/PassagePanel/index.tsx`
- [x] T037 [US4] Verify individual AI actions use the selected paragraph source text and preserve word-selection/highlight behavior in `app/dashboard/passages/[recordId]/PassagePanel/PassageText.tsx`

**Checkpoint**: Missing and existing paragraph translations can be generated or regenerated safely, stale requests cannot overwrite newer results, and the rest of the passage remains interactive.

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validate the complete feature against the design artifacts, deployment boundaries, and project quality gates.

- [x] T038 [P] Update implementation-facing documentation for paragraph persistence, translation states, endpoint usage, and provider configuration in `README.md`
- [x] T039 [P] Verify the Firebase Functions build and deployment surface includes the worker translation behavior without changing the existing trigger path in `functions/src/index.ts` and `firebase.json`
- [ ] T040 Run the display, new-passage generation, partial-provider-failure, manual CRUD, AI regenerate failure, concurrency, legacy-record, and cross-user scenarios from `specs/005-paragraph-vietnamese-translation/quickstart.md`
- [x] T041 Run `pnpm lint` from repository root `.` and resolve every reported error before marking the application tasks complete
- [x] T042 Run `pnpm --dir functions lint` from `functions/` and resolve every reported error before marking worker tasks complete
- [ ] T043 Verify every acceptance scenario, functional requirement, and success criterion in `specs/005-paragraph-vietnamese-translation/spec.md` against the implemented behavior

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies. T001-T003 establish the schema, client boundary, and contract; T001 and T002 can run in parallel.
- **Foundational (Phase 2)**: Depends on Phase 1. T004-T010 block all user stories because they define verified identity, paragraph identity, public detail data, provider behavior, lease recovery, transactional mutation safety, and ownership rules.
- **User Story 1 (Phase 3)**: Depends on Phase 2 and is the MVP slice for reading persisted paragraph translations.
- **User Story 2 (Phase 4)**: Depends on Phase 2 and can proceed in parallel with US1 after the foundational model/provider work; T023-T024 also use the reader surface created by US1.
- **User Story 3 (Phase 5)**: Depends on Phase 2 and the paragraph display component from US1; it adds the authenticated manual mutation surface.
- **User Story 4 (Phase 6)**: Depends on the transaction helpers in Phase 2 and the API/UI surfaces from US3; it adds AI modes without changing manual CRUD semantics.
- **Polish (Phase 7)**: Depends on all desired user stories being implemented.

### User Story Dependencies

- **US1 (P1)**: Depends only on the Foundational phase. It can deliver the paragraph reader independently using already persisted or manually seeded translations.
- **US2 (P1)**: Depends only on the Foundational phase for processing and can be developed in parallel with US1; its UI partial-state work depends on the shared paragraph component.
- **US3 (P1)**: Depends on the Foundational phase and US1's paragraph rendering boundary; manual CRUD remains independently testable on legacy records.
- **US4 (P2)**: Depends on the Foundational phase plus US3's translation API/component contract because it extends the same endpoint and controls with AI modes.

### Parallel Opportunities

- T001 and T002 can run in parallel because they touch different shared modules; T003 can proceed independently as contract documentation.
- T004 and T005 can proceed in parallel after setup; T006-T007 follow the paragraph model, while T008-T010 follow the stored model/provider contract and verified-auth prerequisite.
- T011 and T013 can proceed in parallel after Phase 2 because they define separate reader modules; T012 and T014 must be sequential within `PassageText.tsx`.
- T018, T019, and T021 can proceed in parallel because they touch the submission/dispatch boundary and worker-local provider code; T020 follows the fallback contract, and T022-T024 remain sequential within the durable generation and reader-freshness flow.
- T025 and T027 can proceed in parallel only after the API contract is agreed; T026 follows T025 in the same route, while T028-T029 can proceed in parallel once the component states are defined.
- T032-T033 are sequential in the same route; T034 can begin after the route contract, and T035-T036 can proceed in parallel after the mutation state API exists.
- T038 and T039 can proceed in parallel with T040; T041 and T042 can run independently after their respective source edits, with T043 last.

## Parallel Example: User Story 1

```text
After Phase 2:
Task: T011 [US1] Define paragraph-aware reader types in app/dashboard/passages/[recordId]/PassagePanel/types.ts
Task: T013 [US1] Create the translation display component in app/dashboard/passages/[recordId]/PassagePanel/ParagraphTranslation.tsx

After T011 and T013:
Task: T012 [US1] Preserve highlighting while partitioning segments in app/dashboard/passages/[recordId]/PassagePanel/utils.ts and PassageText.tsx
Task: T015 [US1] Wire paragraph data through app/dashboard/passages/[recordId]/PassagePanel/index.tsx
```

## Parallel Example: User Story 2

```text
After Phase 2:
Task: T018 [US2] Extend the accepted extraction response in app/api/extract/route.ts
Task: T019 [US2] Make Firebase Functions the sole production owner and gate automatic Next.js dispatch in functions/src/index.ts, app/api/extract/route.ts, and lib/api/extraction-dispatch.ts
Task: T021 [US2] Add worker-local translation handling in functions/src/extraction-worker.ts

After T021:
Task: T022 [US2] Start independent durable paragraph generation and preserve paragraph data during worker vocabulary finalization in functions/src/extraction-worker.ts
```

## Parallel Example: User Story 3

```text
After Phase 2 and US1's reader boundary:
Task: T025 [US3] Implement manual add in app/api/translations/route.ts
Task: T027 [US3] Implement translation cache mutations in lib/query-hooks/translations.ts
Task: T028 [US3] Add the inline editor in app/dashboard/passages/[recordId]/PassagePanel/ParagraphTranslation.tsx
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational paragraph model, detail response, provider contract, and transaction guards.
3. Complete Phase 3: User Story 1.
4. Run `pnpm lint`, `pnpm --dir functions lint`, and the display/association scenarios in `quickstart.md`.
5. Stop for MVP validation: users can read and independently expand saved paragraph translations without losing their place.

### Incremental Delivery

1. Complete Setup + Foundational and verify the persistence and ownership contract.
2. Add US1 and validate paragraph association and collapsible display.
3. Add US2 and validate independent new-passage translation generation and partial failure.
4. Add US3 and validate manual add/edit/cancel/delete for legacy and incomplete passages.
5. Add US4 and validate guarded individual AI generation/regeneration.
6. Complete documentation, deployment checks, quickstart scenarios, and final lint/requirements review.

### Parallel Team Strategy

1. Complete Phase 1 together and assign one owner to the shared Firestore/provider foundation.
2. After Phase 2:
   - Contributor A: US1 shared reader and paragraph display.
   - Contributor B: US2 Next.js/Firebase background generation.
   - Contributor C: US3 manual translation API and UI.
3. Complete US4 after the API/component contracts stabilize, then run cross-cutting validation as a group.

## Notes

- Every implementation task uses the required `- [ ] T###` checklist form; story tasks include exactly one `[US#]` label.
- `[P]` is used only where tasks touch separate files or independent documentation surfaces without incomplete-task dependencies.
- No automated test files are planned; `pnpm lint`, `pnpm --dir functions lint`, and the manual quickstart scenarios are the quality gates.
- All translation mutations must resolve the passage beneath the authenticated user's UID and must never trust a client-supplied owner.
- Internal `translationOperationId` claim metadata is server-only and must not appear in public DTOs.
