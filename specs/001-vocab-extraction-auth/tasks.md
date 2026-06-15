# Tasks: Vocab Extraction Authentication

**Input**: Design documents from `/specs/001-vocab-extraction-auth/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No automated tests are included. This project is lint-only per constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and validation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Every task includes an explicit file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization for Firebase + OpenRouter feature work

- [x] T001 Add Firebase SDK dependency in /Users/tue.truonga/Desktop/Personal/VocabsMiner/package.json
- [x] T002 Create environment variable template for Firebase/OpenRouter in /Users/tue.truonga/Desktop/Personal/VocabsMiner/.env.example
- [x] T003 [P] Create Firebase client initialization in /Users/tue.truonga/Desktop/Personal/VocabsMiner/lib/firebase/client.ts
- [x] T004 [P] Create Firebase admin/server initialization in /Users/tue.truonga/Desktop/Personal/VocabsMiner/lib/firebase/admin.ts
- [x] T005 [P] Create OpenRouter config constants in /Users/tue.truonga/Desktop/Personal/VocabsMiner/lib/openrouter/config.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core auth, API, and persistence foundations required before all user stories

**⚠️ CRITICAL**: No user story work should begin until this phase is complete

- [x] T006 Create shared API response/error utilities in /Users/tue.truonga/Desktop/Personal/VocabsMiner/lib/api/http.ts
- [x] T007 [P] Create Firebase auth session verification helper in /Users/tue.truonga/Desktop/Personal/VocabsMiner/lib/auth/session.ts
- [x] T008 [P] Create Firestore data access service for uid-scoped collections in /Users/tue.truonga/Desktop/Personal/VocabsMiner/lib/firebase/firestore-service.ts
- [x] T009 [P] Add route protection middleware for dashboard and APIs in /Users/tue.truonga/Desktop/Personal/VocabsMiner/middleware.ts
- [x] T010 Wire global auth/session provider in /Users/tue.truonga/Desktop/Personal/VocabsMiner/app/layout.tsx
- [x] T011 Define Firestore security rules for uid isolation in /Users/tue.truonga/Desktop/Personal/VocabsMiner/firebase/firestore.rules

**Checkpoint**: Foundation ready; user story implementation can proceed

---

## Phase 3: User Story 1 - Secure Access To Core Feature (Priority: P1) 🎯 MVP

**Goal**: Enforce Google-only sign-in before extraction and establish stable user profile keying

**Independent Test**: While logged out, extraction is blocked and Google sign-in is required; after sign-in, user can access extraction and profile record is created/updated under their UID.

### Implementation for User Story 1

- [x] T012 [US1] Build Google login page and CTA in /Users/tue.truonga/Desktop/Personal/VocabsMiner/app/login/page.tsx
- [x] T013 [P] [US1] Implement Google auth client actions in /Users/tue.truonga/Desktop/Personal/VocabsMiner/lib/auth/google-auth.ts
- [x] T014 [US1] Add auth callback/session bootstrap endpoint in /Users/tue.truonga/Desktop/Personal/VocabsMiner/app/api/auth/session/route.ts
- [x] T015 [US1] Gate landing/extraction entry by auth state in /Users/tue.truonga/Desktop/Personal/VocabsMiner/app/page.tsx
- [x] T016 [US1] Upsert learner profile document on successful login in /Users/tue.truonga/Desktop/Personal/VocabsMiner/lib/firebase/firestore-service.ts
- [x] T017 [US1] Add login failure/cancel feedback UI in /Users/tue.truonga/Desktop/Personal/VocabsMiner/app/login/login-status.tsx

**Checkpoint**: US1 is independently functional and demoable

---

## Phase 4: User Story 2 - Extract Academic Vocabulary From Passage (Priority: P2)

**Goal**: Accept an authenticated passage submission and return contextualized academic vocabulary

**Independent Test**: Authenticated user submits a valid passage and receives words, definitions, and context (or explicit no-results) within expected response behavior.

### Implementation for User Story 2

- [x] T018 [P] [US2] Implement OpenRouter client with timeout/retry behavior in /Users/tue.truonga/Desktop/Personal/VocabsMiner/lib/openrouter/client.ts
- [x] T019 [P] [US2] Add extraction request/response schema validation in /Users/tue.truonga/Desktop/Personal/VocabsMiner/lib/openrouter/extraction-schema.ts
- [x] T020 [US2] Implement extraction API endpoint per contract in /Users/tue.truonga/Desktop/Personal/VocabsMiner/app/api/extract/route.ts
- [x] T021 [US2] Build authenticated extraction form UI in /Users/tue.truonga/Desktop/Personal/VocabsMiner/app/dashboard/page.tsx
- [x] T022 [US2] Render extraction results and no-results state in /Users/tue.truonga/Desktop/Personal/VocabsMiner/app/dashboard/extraction-result.tsx
- [x] T023 [US2] Map extraction/provider/storage failures to user-safe messages in /Users/tue.truonga/Desktop/Personal/VocabsMiner/app/dashboard/extraction-status.tsx

**Checkpoint**: US2 is independently functional and demoable

---

## Phase 5: User Story 3 - Build Personal Vocabulary Bank (Priority: P3)

**Goal**: Persist and retrieve user-specific vocabulary history with deduplication

**Independent Test**: Same user can run multiple extractions and retrieve accumulated vocabulary with duplicates merged by normalized key.

### Implementation for User Story 3

- [x] T024 [US3] Add vocabulary upsert and deduplication logic in /Users/tue.truonga/Desktop/Personal/VocabsMiner/lib/firebase/firestore-service.ts
- [x] T025 [US3] Persist extraction vocabulary output to Firestore in /Users/tue.truonga/Desktop/Personal/VocabsMiner/app/api/extract/route.ts
- [x] T026 [US3] Implement vocabulary collection API endpoint in /Users/tue.truonga/Desktop/Personal/VocabsMiner/app/api/vocabulary/route.ts
- [x] T027 [US3] Build vocabulary list panel for authenticated user in /Users/tue.truonga/Desktop/Personal/VocabsMiner/app/dashboard/vocabulary-list.tsx
- [x] T028 [US3] Add vocabulary pagination and query controls in /Users/tue.truonga/Desktop/Personal/VocabsMiner/app/dashboard/vocabulary-list.tsx

**Checkpoint**: US3 is independently functional and demoable

---

## Phase 6: User Story 4 - Review Personal Learning History (Priority: P3)

**Goal**: Show profile history with both reading passages and vocabulary history

**Independent Test**: Authenticated user with prior activity can open profile history and see only their own passages and vocabulary timeline.

### Implementation for User Story 4

- [x] T029 [US4] Persist reading passage history records in /Users/tue.truonga/Desktop/Personal/VocabsMiner/lib/firebase/firestore-service.ts
- [x] T030 [US4] Implement profile history API endpoint in /Users/tue.truonga/Desktop/Personal/VocabsMiner/app/api/profile/history/route.ts
- [x] T031 [US4] Create profile history route and shell in /Users/tue.truonga/Desktop/Personal/VocabsMiner/app/dashboard/history/page.tsx
- [x] T032 [US4] Build combined passages and vocabulary history panel in /Users/tue.truonga/Desktop/Personal/VocabsMiner/app/dashboard/history/history-panel.tsx
- [x] T033 [US4] Add cursor-based pagination handling in /Users/tue.truonga/Desktop/Personal/VocabsMiner/app/dashboard/history/history-panel.tsx

**Checkpoint**: US4 is independently functional and demoable

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Hardening and final validation across stories

- [x] T034 [P] Update Firestore rule constraints for immutable uid and scoped access in /Users/tue.truonga/Desktop/Personal/VocabsMiner/firebase/firestore.rules
- [x] T035 [P] Document setup/env/run instructions for new flows in /Users/tue.truonga/Desktop/Personal/VocabsMiner/README.md
- [x] T036 Align feature quickstart with implemented flows in /Users/tue.truonga/Desktop/Personal/VocabsMiner/specs/001-vocab-extraction-auth/quickstart.md
- [x] T037 Run lint and resolve any remaining issues referenced from /Users/tue.truonga/Desktop/Personal/VocabsMiner/package.json

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: no prerequisites
- **Phase 2 (Foundational)**: depends on Phase 1; blocks all user stories
- **Phases 3-6 (User Stories)**: depend on Phase 2 completion
- **Phase 7 (Polish)**: depends on completion of selected user stories

### User Story Dependencies

- **US1 (P1)**: starts immediately after Foundational phase
- **US2 (P2)**: depends on US1 auth gating and session context
- **US3 (P3)**: depends on US2 extraction output pipeline
- **US4 (P3)**: depends on US1 auth and benefits from US2/US3 data creation

### Within Each User Story

- Service/helper changes before route handlers
- Route handlers before UI wiring
- UI state/error handling after core data flow is in place
- Complete story checkpoint validation before moving on

## Parallel Opportunities

- Setup tasks `T003`, `T004`, `T005` can run in parallel
- Foundational tasks `T007`, `T008`, `T009` can run in parallel after `T006`
- US1 task `T013` can run in parallel with `T012`
- US2 tasks `T018` and `T019` can run in parallel
- Polish tasks `T034` and `T035` can run in parallel

## Parallel Example: User Story 1

```bash
# Parallelizable US1 tasks:
Task T012: Build Google login page and CTA in app/login/page.tsx
Task T013: Implement Google auth client actions in lib/auth/google-auth.ts
```

## Parallel Example: User Story 2

```bash
# Parallelizable US2 tasks:
Task T018: Implement OpenRouter client with timeout/retry in lib/openrouter/client.ts
Task T019: Add extraction schema validation in lib/openrouter/extraction-schema.ts
```

## Parallel Example: User Story 3

```bash
# Parallelizable setup before endpoint wiring:
Task T024: Add vocabulary upsert and dedup logic in lib/firebase/firestore-service.ts
Task T027: Build vocabulary list panel in app/dashboard/vocabulary-list.tsx
```

## Parallel Example: User Story 4

```bash
# Parallelizable US4 tasks:
Task T031: Create profile history route shell in app/dashboard/history/page.tsx
Task T029: Persist reading passage history records in lib/firebase/firestore-service.ts
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup)
2. Complete Phase 2 (Foundational)
3. Complete Phase 3 (US1)
4. Validate auth gate and Google login flow end-to-end

### Incremental Delivery

1. Deliver US1 for gated access and profile identity
2. Add US2 for extraction core value
3. Add US3 for persistent vocabulary bank
4. Add US4 for profile history visibility
5. Finish with Phase 7 polish and lint gate

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Then split by story track:
   - Engineer A: US2 extraction pipeline
   - Engineer B: US3 vocabulary persistence/UI
   - Engineer C: US4 profile history endpoints/UI

## Notes

- Task format follows required checklist style with IDs, optional `[P]`, and `[USx]` labels for story phases
- No automated test tasks are included because this feature and constitution define lint-only validation
- Run `pnpm lint` before closing any task batch
