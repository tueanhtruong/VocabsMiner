# Implementation Plan: Background Vocabulary Extraction

**Branch**: `004-background-vocabulary-extraction` | **Date**: 2026-08-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-background-vocabulary-extraction/spec.md`

## Summary

Split passage persistence from vocabulary extraction. The Next.js submission route will validate and immediately save a user-owned passage with `pending` status and an empty vocabulary list, then return the record identifier without waiting for OpenRouter. A Firebase-managed Firestore trigger will process pending records in a durable server context, transactionally claim each attempt to prevent duplicate work, and update the record to `completed` or `error`. Existing history and detail surfaces will expose status, while the detail view will offer an authenticated retry action for failed records.

## Technical Context

**Language/Version**: TypeScript 5; Next.js 16.2.9 / React 19.2.4; Firebase Functions runtime compatible with Node.js 20+

**Primary Dependencies**: Next.js App Router, TanStack Query 5, Firebase Admin/Firestore, Firebase Cloud Functions, OpenRouter client helpers, Zod

**Storage**: Firestore user passage documents under `users/{uid}/passages/{recordId}`; passage status and extraction metadata remain the source of truth

**Testing**: None — lint only (`pnpm lint` must exit 0 after every task per constitution)

**Target Platform**: Modern desktop and mobile browsers plus Firebase-managed Node.js background execution

**Project Type**: Next.js web application with Firebase background worker integration

**Performance Goals**: Return an accepted valid submission with its pending record in under 2 seconds for normal conditions; update status after provider completion without requiring the submitting browser to remain open; poll or refresh status no more often than every 2 seconds while a detail view is active

**Constraints**: Firebase remains the only persistence/backend platform; OpenRouter calls stay server-side; no fire-and-forget work owned by a Next.js response; no new client state library; no automated test infrastructure; preserve user isolation and existing completed-passage behavior

**Scale/Scope**: One passage extraction job per history record, retryable status transitions, existing dashboard/history/detail surfaces, one Firebase Functions package and one Firestore-triggered worker

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Next.js App Router: pass. Web routes and UI changes stay under `app/`, with client components only for form, polling, and retry interaction.
- Firebase as source of truth: pass. Passage state, queue/claim metadata, and results remain in Firestore; direct Firestore access remains inside `lib/firebase/` or the background worker service.
- No tests: pass. Validation uses `pnpm lint` and documented manual/delayed-provider scenarios; no test files or framework are introduced.
- Simplicity and YAGNI: pass with one justified deployment addition. A Firebase trigger is required because route-level fire-and-forget work is not durable after a serverless response; no general job framework or client global store is added.

## Project Structure

### Documentation (this feature)

```text
specs/004-background-vocabulary-extraction/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── background-extraction-api.md
└── tasks.md              # Created by /speckit.tasks, not this command
```

### Source Code (repository root)

```text
app/
├── api/
│   ├── extract/route.ts                 # create pending record and return immediately
│   ├── extract/retry/route.ts            # authenticated retry transition
│   └── profile/history/route.ts          # include status/error metadata in history
└── dashboard/
    ├── page.tsx                         # remove blocking overlay; submit and navigate
    ├── extraction-result.tsx             # pending/error presentation if retained
    ├── history/history-panel.tsx         # status indicators and counts
    └── passages/[recordId]/page.tsx      # status polling and retry/error detail

lib/
├── firebase/firestore-service.ts        # status model and guarded mutations
└── query-hooks/
    ├── extraction.ts                     # pending response and status/retry hooks
    └── history.ts                        # status-aware history types/cache invalidation

functions/
├── package.json                          # Firebase Functions runtime dependencies
├── tsconfig.json
└── src/
    ├── index.ts                          # Firestore trigger registration
    └── extraction-worker.ts              # claim, extract, and finalize status

firebase/
└── firestore.rules                       # verify any new worker-only data remains protected
```

**Structure Decision**: Keep the user-facing API and UI in the existing Next.js App Router project. Add a narrowly scoped `functions/` Firebase Functions package because durable background execution cannot be guaranteed by a returned Next.js route. Store job state on the existing passage document rather than adding a general queue collection; a transactional claim token prevents duplicate trigger delivery and stale attempts from overwriting newer retries.

## Complexity Tracking

| Violation                               | Why Needed                                                                     | Simpler Alternative Rejected Because                                                          |
| --------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Additional `functions/` deployment unit | Durable work must continue after the Next.js response and browser session end. | Next.js fire-and-forget work has no reliable execution guarantee after the request lifecycle. |
