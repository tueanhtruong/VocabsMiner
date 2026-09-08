# Implementation Plan: Paragraph-Level Vietnamese Translation & Management

**Branch**: `005-paragraph-vietnamese-translation` | **Date**: 2026-09-03 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/005-paragraph-vietnamese-translation/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Add durable, paragraph-scoped Vietnamese translations to saved passages. Normalize each passage into ordered non-empty paragraph records, expose those records through passage detail, generate translations independently from vocabulary extraction, and provide authenticated manual CRUD plus AI generate/regenerate operations. The implementation keeps translations embedded in the existing Firestore passage document, uses server-side OpenRouter calls with strict response validation, and guards AI completion with transactional per-paragraph operation IDs.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5; Next.js 16.2.9 / React 19.2.4; Firebase Functions on Node.js 20

**Primary Dependencies**: Next.js App Router, TanStack Query 5, Firebase Admin/Firestore, Firebase Cloud Functions, OpenRouter client, Zod, Tailwind CSS 4

**Storage**: Firestore passage documents at `users/{uid}/passages/{recordId}`, with an embedded ordered `paragraphs` array; raw passage and vocabulary fields remain unchanged

**Testing**: None — lint only (`pnpm lint` must exit 0 after every task per constitution)

**Target Platform**: Modern desktop and mobile browsers plus Firebase-managed Node.js background execution

**Project Type**: Next.js App Router web application with Firebase background worker integration

**Performance Goals**: Manual translation mutations should return in the normal API request window; AI progress must remain paragraph-local; new-passage translation should be available within 15 seconds after provider completion for at least 95% of successful processed passages

**Constraints**: Firebase remains the only persistence/backend platform; OpenRouter credentials stay server-side; translation failures must not fail vocabulary extraction; no new client state library or automated test infrastructure; existing desktop/mobile reader and user ownership behavior must remain intact

**Scale/Scope**: Existing passage detail and extraction flows, one translation API route, one embedded paragraph model, one production Firebase processor plus an explicit local/manual Next.js fallback, and shared desktop/mobile reader UI

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Next.js App Router**: PASS. UI changes remain in `app/` and the shared passage reader; client components are limited to accordion, form, and async mutation state.
- **Firebase as source of truth**: PASS after the authentication prerequisite. Paragraph and translation state live in the authenticated user's Firestore passage document; direct Firestore access remains in `lib/firebase/` or the Functions worker, and ownership derives from a verified Firebase token subject.
- **No tests / lint quality gate**: PASS. No test files or framework will be introduced. Run `pnpm lint` after every implementation task and `pnpm --dir functions lint` for worker changes.
- **Simplicity and YAGNI**: PASS. Use one embedded array and one focused API route; do not add a translation collection, queue framework, global state library, or new persistence service.

**Post-Design Re-evaluation**: PASS with implementation gates. Verified Firebase ID-token authentication, explicit Firebase-worker production ownership, and lease-based stale-claim recovery are required before the feature can be considered complete.

## Project Structure

### Documentation (this feature)

```text
specs/005-paragraph-vietnamese-translation/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app/
├── api/
│   ├── extract/route.ts                  # initialize paragraph records for new passages
│   ├── extract/process/route.ts           # local/manual extraction parity and translation orchestration
│   ├── translations/route.ts              # authenticated add/edit/delete/generate/regenerate API
│   └── vocabulary/route.ts                # return paragraph data in passage detail response
└── dashboard/passages/[recordId]/
    ├── page.tsx                           # detail types, query freshness, translation mutation handlers
    ├── PassageDrawer.tsx                   # preserve shared mobile forwarding contract
    └── PassagePanel/
        ├── PassageText.tsx                # paragraph rendering, accordion, translation states
        ├── types.ts                        # paragraph-aware reader props/types
        └── ...                             # existing highlighting and word-action behavior

lib/
├── auth/session.ts                          # verify Firebase ID tokens for every authenticated route
├── firebase/firestore-service.ts           # paragraph model, normalization, ownership, transactional mutations
├── openrouter/client.ts                    # server-side paragraph translation request and validation
├── openrouter/extraction-schema.ts         # translation response schema/parser if kept beside extraction schemas
└── query-hooks/
    ├── api-client.ts                       # reuse existing authenticated request handling
    └── translations.ts                     # mutation hooks and detail-cache invalidation/update

functions/src/
├── extraction-worker.ts                    # durable per-paragraph translation generation
└── index.ts                                # existing passage-write trigger remains registered

firebase/firestore.rules                    # verify client translation updates preserve ownership/status constraints
```

**Structure Decision**: Keep the feature inside the existing Next.js App Router and Firebase layout. Extend the existing passage document and detail response, add one focused authenticated translation route and service surface, and make the Firebase worker the sole automatic production processor. The Next.js processing route remains an explicit local/manual fallback using the same paragraph normalization and translation state rules. The shared `PassagePanel` remains the single desktop/mobile reader boundary.

## Implementation Sequencing

1. **Domain model and compatibility**: Add paragraph types, normalization, deterministic IDs, public DTO conversion, legacy projection/backfill, and passage creation initialization in `lib/firebase/firestore-service.ts`. Preserve raw passage and vocabulary fields.
2. **Provider contract**: Add the strict single-paragraph translation schema, OpenRouter helper, timeout/retry behavior, and sanitized translation-provider errors in the server-side OpenRouter module.
3. **Durable new-passage processing**: Make `functions/src/extraction-worker.ts` the sole production owner for vocabulary and paragraph translation work. Keep `app/api/extract/process/route.ts` as an explicit local/manual fallback only, gate automatic `dispatchPassageExtraction()` accordingly, and ensure passage/paragraph claims make accidental overlap a no-op. Vocabulary finalization and failure paths must not erase paragraph data.
4. **Authenticated persistence API**: Verify Firebase ID tokens before route ownership checks. Add transaction-backed service methods for manual save/delete, AI claim, AI completion, stale-claim recovery, and AI failure. Add `app/api/translations/route.ts` with POST/PUT/DELETE contract, ownership checks, validation, conflict handling, and API error mapping.
5. **Passage detail contract and cache**: Extend `PassageDetailApiItem` and `GET /api/vocabulary` with public paragraphs. Add translation query mutations using existing `requestJson` and update or invalidate `passage-detail` without changing sibling paragraphs.
6. **Shared reader interaction**: Make `PassageText` render ordered paragraph blocks while preserving word-token selection and highlight ranges. Add per-paragraph expand/collapse, Add Translation, inline editor Save/Cancel, Delete confirmation, Generate with AI, Regenerate, loading, and failure states in the shared panel used by desktop and mobile.
7. **Rules and operational validation**: Confirm Firestore rules continue to prohibit client ownership/status/worker-claim changes, run lint for root and Functions, and execute every scenario in `quickstart.md`, including legacy records, partial provider failure, concurrency, and cross-user access.

## Integration Notes

- Keep translation metadata separate from passage-level extraction status, `errorReason`, and `activeAttemptId`.
- Translation writes will retrigger the existing passage-write function, but non-pending passage status must short-circuit vocabulary processing. Firebase Functions is the only automatic production processor; `/api/extract/process` is local/manual fallback.
- Public DTOs must omit `translationOperationId`; it is only a server-side claim token.
- AI completion must verify the operation ID in a transaction before writing, and failed regeneration must leave the previous translation text intact. Claims include a lease expiry so abandoned requests can be reclaimed safely.
- The reader should poll/refetch the single passage-detail query while any paragraph is generating rather than creating one query per paragraph.
- Do not reuse the transient selected-word Google Translate hook for persisted paragraph translations.
- All ownership checks must use a verified Firebase ID token; a raw bearer value or client-supplied UID is never authoritative.

## Complexity Tracking

No constitution violations. The embedded paragraph array, focused translation route, and worker-local provider logic are constrained to the existing passage and background-processing boundaries; no new project, queue, state library, or test framework is introduced.
