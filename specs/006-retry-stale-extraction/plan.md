# Implementation Plan: Retry Stale Pending Extraction

**Branch**: `main` | **Date**: 2026-09-08 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/006-retry-stale-extraction/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Add stale-pending recovery to the existing background vocabulary extraction flow. Store a `pendingSince` timestamp on passage records, expose it in the authenticated passage-detail response, and show Retry only when a pending record has exceeded 15 minutes. Reuse the existing authenticated retry route, Firestore transaction, dispatch path, and claim-token worker safeguards so a retry resets the current pending lifecycle, invalidates any older worker claim, and starts one fresh extraction attempt without changing the saved passage.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5; Next.js 16.2.9 / React 19.2.4; Firebase Functions on Node.js 20

**Primary Dependencies**: Next.js App Router, TanStack Query 5, Firebase Admin/Firestore, Firebase Cloud Functions, OpenRouter client, Zod, Tailwind CSS 4

**Storage**: Firestore passage documents at `users/{uid}/passages/{recordId}`; add optional `pendingSince` lifecycle metadata while preserving existing passage, vocabulary, status, and claim fields

**Testing**: None — lint only (`pnpm lint` must exit 0 after every task per constitution)

**Target Platform**: Modern desktop and mobile browsers plus Firebase-managed Node.js background execution

**Project Type**: Next.js App Router web application with Firebase background worker integration

**Performance Goals**: Accepted stale retries should return the fresh pending state within 2 seconds under normal conditions; an open detail page should reveal eligibility at the 15-minute boundary through existing refresh behavior without blocking passage reading

**Constraints**: Firebase remains the only persistence/backend platform; ownership and stale eligibility must be rechecked server-side; old worker claims must not overwrite a newer retry; no new queue, state library, migration framework, test infrastructure, or provider integration

**Scale/Scope**: One embedded passage lifecycle field, one existing retry API/service path, existing detail query and page, existing Firebase worker and local/manual fallback, plus focused API/data-model documentation

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Next.js App Router**: PASS. Detail-page and query changes remain in `app/` and `lib/query-hooks/`; no new pages or client state library are needed.
- **Firebase as source of truth**: PASS. `pendingSince`, status, claim tokens, and vocabulary results remain in the authenticated user's Firestore passage document; direct Firestore access stays in `lib/firebase/` and Functions.
- **No tests / lint quality gate**: PASS. No test files or framework are introduced. Run `pnpm lint` and `pnpm --dir functions lint` as documented validation gates.
- **Simplicity and YAGNI**: PASS. Reuse the existing retry endpoint, dispatch mechanism, trigger, transaction, and claim-token model; add no separate queue or scheduler.

**Post-Design Re-evaluation**: PASS. The design keeps Firestore as the source of truth, makes stale eligibility server-authoritative, preserves claim-token protection against late workers, uses the existing App Router/Firebase boundaries, and introduces no constitution violations.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
app/
├── api/
│   ├── extract/route.ts                 # existing pending creation; preserve pendingSince on creation response if needed
│   └── extract/retry/route.ts           # map stale-pending eligibility and retry errors
└── dashboard/passages/[recordId]/
  └── page.tsx                         # detail DTO, threshold visibility, retry progress/error UI

lib/
├── firebase/firestore-service.ts        # pendingSince model, DTO, guarded reset, claim/finalize lifecycle
└── query-hooks/extraction.ts            # retry response type and existing cache invalidation

functions/src/
└── extraction-worker.ts                  # preserve/backfill pendingSince and clear it on terminal finalization

specs/006-retry-stale-extraction/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/retry-extraction-api.md
```

**Structure Decision**: Keep the change inside the existing passage document and extraction boundaries. The Next.js service owns authenticated transactional state transitions, the Firebase Function remains the durable production processor, and the existing local/manual process route remains a fallback. The shared detail page derives button visibility from the pending timestamp but never authorizes the mutation client-side.

## Implementation Sequencing

1. **Lifecycle data and compatibility**: Add `pendingSince` to stored passage types and passage-detail DTOs. Set it in `createPendingPassage`, preserve or backfill it when Next.js or Functions claims a pending record, and remove it in success/failure finalization. Use valid `createdAt` as the read fallback for legacy pending records.
2. **Transactional stale retry**: Extend `retryPassageExtraction` to accept existing `error` records and only pending records whose elapsed duration is strictly greater than 15 minutes. In one transaction, clear stale vocabulary/error/claim fields, set a fresh `pendingSince`, preserve title/content/createdAt, and rely on claim-token mismatch to invalidate older workers.
3. **API contract and dispatch**: Update `POST /api/extract/retry` error mapping and response typing. Dispatch only after an accepted transaction; distinguish unavailable fresh-pending/completed/timestamp-invalid states from authentication, not-found, and malformed-input errors.
4. **Detail visibility and interaction**: Extend the passage-detail response and page type, derive stale eligibility from `status` plus `pendingSince`, and make an open pending page re-evaluate at the 15-minute boundary using the existing query refresh/polling path. Render Retry with disabled progress feedback and actionable mutation errors while preserving the existing error-state retry UI.
5. **Validation and documentation**: Verify fresh, exact-threshold, stale, successful, failed, concurrent, stale-worker, legacy, and cross-user scenarios from `quickstart.md`. Run `pnpm lint` and `pnpm --dir functions lint` after implementation tasks.

## Integration Notes

- `pendingSince` measures the current `pending` lifecycle, not original submission time; `createdAt` remains immutable.
- A stale retry may clear an existing `activeAttemptId`. Existing success/failure finalizers must continue to require an exact claim-token match, making late results from the old attempt no-ops.
- The client-visible `pendingSince` is informational for button timing only. The Firestore transaction is authoritative for eligibility and ownership.
- Terminal `completed` and `error` states must omit `pendingSince` and continue existing vocabulary/error behavior.
- Paragraph translation metadata is unrelated to extraction retry and must remain intact when vocabulary extraction is reset.
- The existing error retry flow remains supported; this feature adds stale-pending eligibility without changing completed/error ownership rules.

## Complexity Tracking

No constitution violations. The feature adds one lifecycle timestamp and extends existing transactional retry/worker/detail surfaces; it does not introduce a new persistence collection, queue, state library, or test framework.
