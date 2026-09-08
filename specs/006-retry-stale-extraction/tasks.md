# Tasks: Retry Stale Pending Extraction

**Input**: Design documents from `/specs/006-retry-stale-extraction/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/retry-extraction-api.md, quickstart.md

**Tests**: No automated test tasks are included. The project constitution prohibits test infrastructure; validate behavior through `quickstart.md`, `pnpm lint`, and `pnpm --dir functions lint`.

## Phase 1: Setup

**Purpose**: Confirm the existing project surfaces are sufficient for this additive feature.

No new dependencies, routes, collections, or project scaffolding are required. Work begins with the existing Next.js extraction API, Firestore passage service, Firebase Functions worker, and passage detail query.

---

## Phase 2: Foundational Lifecycle Support

**Purpose**: Establish the shared timestamp and DTO behavior required by every user story.

- [x] T001 Add optional `pendingSince` storage typing, a 15-minute stale threshold constant, and helpers for resolving valid current-pending timestamps with the legacy `createdAt` fallback in `lib/firebase/firestore-service.ts`
- [x] T002 Update passage-detail DTO conversion to expose `pendingSince` only for pending records and serialize legacy pending records from a valid `createdAt` fallback in `lib/firebase/firestore-service.ts`
- [x] T003 [P] Extend the passage extraction response and retry response types to carry the accepted pending timestamp in `lib/query-hooks/extraction.ts`
- [x] T004 [P] Update the Firebase worker passage record typing and claim/finalization lifecycle to preserve or backfill `pendingSince` on pending work and remove it on completed or failed work in `functions/src/extraction-worker.ts`

**Checkpoint**: Passage records and detail responses can represent the current pending lifecycle without changing ownership, paragraph translation metadata, or terminal extraction behavior.

---

## Phase 3: User Story 1 - Recover a Stuck Extraction (Priority: P1) 🎯 MVP

**Goal**: Let an owner restart a pending extraction only after it has been pending for more than 15 minutes, while preserving the saved passage and creating a fresh pending lifecycle.

**Independent Test**: Use a pending passage with `pendingSince` more than 15 minutes ago, open its detail page, select Retry, and confirm the same title/content remain while status returns to pending with a newer pending timestamp.

### Implementation for User Story 1

- [x] T005 [US1] Set `pendingSince` when creating a new pending passage, preserve `createdAt`, and return the pending timestamp from the create response in `lib/firebase/firestore-service.ts` and `app/api/extract/route.ts`
- [x] T006 [US1] Extend `retryPassageExtraction` with a transaction that accepts existing error records or pending records strictly older than 15 minutes, clears stale vocabulary/error/claim fields, sets a fresh `pendingSince`, and preserves title/content/createdAt in `lib/firebase/firestore-service.ts`
- [x] T007 [US1] Ensure pending claim and local/manual extraction paths retain the current `pendingSince` lifecycle while using the existing `activeAttemptId` claim token in `lib/firebase/firestore-service.ts` and `app/api/extract/process/route.ts`
- [x] T008 [US1] Map the new `RETRY_NOT_AVAILABLE` and stale-state failures to actionable API errors, dispatch extraction only after an accepted transaction, and return the refreshed `pendingSince` in `app/api/extract/retry/route.ts`

**Checkpoint**: A stale pending passage can be reset exactly once into a fresh pending extraction without losing source content, and fresh/completed/invalid records cannot be reset.

---

## Phase 4: User Story 2 - Understand Retry Progress and Outcomes (Priority: P1)

**Goal**: Make stale eligibility visible on the passage detail page and provide clear retry progress, success refresh, and failure feedback.

**Independent Test**: Open fresh and stale pending detail pages, verify Retry appears only beyond the threshold, select it once, and confirm the page refreshes to completed or error outcomes while preserving the passage context.

### Implementation for User Story 2

- [x] T009 [US2] Add `pendingSince` to the passage detail response type and derive stale-pending eligibility only when status is pending and elapsed time is strictly greater than 15 minutes in `app/dashboard/passages/[recordId]/page.tsx`
- [x] T010 [US2] Make an open pending detail page re-evaluate at the 15-minute boundary using the existing React Query refetch behavior without blocking passage reading or requiring resubmission in `app/dashboard/passages/[recordId]/page.tsx`
- [x] T011 [US2] Render a stale-pending Retry control with disabled in-progress feedback, actionable mutation errors, and refreshed detail/history cache behavior while retaining the existing error-status retry UI in `app/dashboard/passages/[recordId]/page.tsx` and `lib/query-hooks/extraction.ts`
- [x] T012 [US2] Ensure the pending detail presentation continues to show the saved passage and an empty vocabulary result while retry is accepted or processing, and shows the existing completed/error outcomes after refetch in `app/dashboard/passages/[recordId]/page.tsx`

**Checkpoint**: Owners can discover and initiate stale retry from an open detail page, cannot repeatedly submit it through the UI, and can observe the resulting extraction state.

---

## Phase 5: User Story 3 - Keep Passage Recovery Secure (Priority: P1)

**Goal**: Preserve authenticated ownership and prevent overlapping or obsolete extraction attempts from changing the authoritative passage state.

**Independent Test**: Attempt stale retry with another authenticated user and with overlapping requests, then confirm no cross-user mutation occurs and only one fresh attempt can finalize.

### Implementation for User Story 3

- [x] T013 [US3] Verify and harden owner-scoped retry lookup and authenticated error handling so missing authentication, cross-user records, malformed IDs, and missing records cannot start extraction in `app/api/extract/retry/route.ts` and `lib/firebase/firestore-service.ts`
- [x] T014 [US3] Make concurrent stale retry transactions reject the later request after the first request refreshes `pendingSince`, while retaining the existing idempotent error-record retry behavior in `lib/firebase/firestore-service.ts`
- [x] T015 [US3] Confirm worker success and failure finalizers remain claim-token guarded and cannot overwrite a newer retry after the old `activeAttemptId` is cleared in `functions/src/extraction-worker.ts`
- [x] T016 [US3] Preserve paragraph and translation fields when resetting vocabulary extraction and confirm cross-user detail reads remain isolated to the authenticated owner in `lib/firebase/firestore-service.ts` and `app/api/vocabulary/route.ts`

**Checkpoint**: Retry is owner-scoped, race-safe, and unable to let an obsolete worker or another user alter the authoritative passage state.

---

## Phase 6: Polish & Cross-Cutting Validation

**Purpose**: Align the implementation documents with the final behavior and complete the repository quality gates.

- [x] T017 [P] Update the retry API contract and data-model documentation if implementation naming or response/error details differ from the planned `pendingSince` behavior in `specs/006-retry-stale-extraction/contracts/retry-extraction-api.md` and `specs/006-retry-stale-extraction/data-model.md`
- [ ] T018 [P] Execute every manual scenario in `specs/006-retry-stale-extraction/quickstart.md`, including exact-threshold, legacy timestamp, concurrent retry, stale worker, failure, and cross-user cases, and record any implementation adjustments in `specs/006-retry-stale-extraction/quickstart.md`
- [x] T019 Run `pnpm lint` and resolve all feature-related errors before marking the feature complete in the repository source files
- [x] T020 Run `pnpm --dir functions lint` and resolve all feature-related worker type or lint errors before marking the feature complete in `functions/src/extraction-worker.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No project scaffolding is needed; proceed directly to foundational lifecycle support.
- **Phase 2 (Foundational)**: Must complete before all user story phases because every story depends on the shared pending timestamp and DTO behavior.
- **Phase 3 (US1)**: Depends on Phase 2 and delivers the MVP backend retry transition.
- **Phase 4 (US2)**: Depends on T003, T005, T006, and T008 so the page can consume the timestamp and invoke the guarded retry API.
- **Phase 5 (US3)**: Depends on T006, T008, and T015; it hardens the shared retry and worker paths after the primary flow exists.
- **Phase 6 (Polish)**: Depends on all desired story phases and must finish with both lint gates passing.

### User Story Dependencies

- **User Story 1 (P1)**: Depends only on Foundational. This is the MVP slice.
- **User Story 2 (P1)**: Depends on the US1 retry response and lifecycle reset so the detail page can display and refresh the correct state.
- **User Story 3 (P1)**: Depends on the US1 transaction and worker lifecycle; it verifies and hardens authorization, concurrency, and stale-result protection.

### Parallel Opportunities

- T003 and T004 can run in parallel after the lifecycle field design is agreed because they touch separate files.
- After T006 and T008 establish the retry contract, T009 and T010 can be developed in the detail page while T013 and T014 harden backend ownership and concurrency in the service/route.
- T017 and T018 can run in parallel after implementation stabilizes because one updates design documentation and the other exercises the manual scenarios.
- T019 and T020 can run in parallel as separate repository quality gates after source changes are complete.

## Parallel Example: User Story 1

```text
After Phase 2:
- T005: initialize pendingSince for new records in lib/firebase/firestore-service.ts
- T006: implement stale-pending transaction reset in lib/firebase/firestore-service.ts

After T006:
- T007: align local/manual claim behavior in lib/firebase/firestore-service.ts and app/api/extract/process/route.ts
- T008: expose retry errors and dispatch accepted retries in app/api/extract/retry/route.ts
```

## Parallel Example: User Story 2

```text
After T003, T005, T006, and T008:
- T009: derive stale eligibility in app/dashboard/passages/[recordId]/page.tsx
- T010: refresh the open detail page at the threshold in app/dashboard/passages/[recordId]/page.tsx
- T011: connect retry progress and cache invalidation in app/dashboard/passages/[recordId]/page.tsx and lib/query-hooks/extraction.ts
```

## Parallel Example: User Story 3

```text
After US1:
- T013: harden authenticated owner/error handling in app/api/extract/retry/route.ts and lib/firebase/firestore-service.ts
- T014: verify transactional overlap behavior in lib/firebase/firestore-service.ts
- T015: preserve claim-token finalization guards in functions/src/extraction-worker.ts
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2 foundational lifecycle support.
2. Complete Phase 3 User Story 1.
3. Run `pnpm lint` and `pnpm --dir functions lint`.
4. Execute Quickstart Scenarios 1 through 3 to confirm stale eligibility, fresh reset timing, and successful background continuation.
5. Stop for MVP validation: owners can recover passages stuck in pending without losing saved content.

### Incremental Delivery

1. Complete foundational timestamp and DTO support.
2. Deliver US1 backend retry recovery and validate transaction behavior.
3. Deliver US2 detail-page visibility and feedback, then validate the threshold boundary and outcomes.
4. Deliver US3 ownership, concurrency, and stale-worker hardening.
5. Complete documentation, all quickstart scenarios, and both lint gates.

## Notes

- Every task uses the required `- [ ] [TaskID] [P?] [Story?] Description` checklist format and includes a concrete file path.
- No test files or test framework tasks are included because the constitution defines lint and manual quickstart validation as the quality gate.
- `pendingSince` is the current pending lifecycle timestamp; `createdAt` remains immutable and `activeAttemptId` remains an internal worker claim token.
