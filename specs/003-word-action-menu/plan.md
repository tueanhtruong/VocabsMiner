# Implementation Plan: Word Action Menu

**Branch**: `[003-word-action-menu]` | **Date**: 2026-06-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-word-action-menu/spec.md`

## Summary

Add a contextual popup menu in the passage detail view when a learner selects a word in the left panel. The first action translates the selected word to Vietnamese using `@vitalets/google-translate-api`; the second action generates a vocabulary draft from the selected word and passage context using OpenRouter, then opens the existing add-new-vocabulary form prefilled with that draft so the learner can save it later.

## Technical Context

**Language/Version**: TypeScript 5 on Next.js 16 / React 19

**Primary Dependencies**: Next.js App Router, React, TanStack Query, Firebase Auth/Firestore, OpenRouter client helpers, `@vitalets/google-translate-api`

**Storage**: Firestore for existing passage and vocabulary records; no new persistent store required for the popup menu itself

**Testing**: None — lint only (`pnpm lint` must exit 0 after every task per constitution)

**Target Platform**: Web application in modern desktop and mobile browsers

**Project Type**: Next.js web app

**Performance Goals**: Keep the popup responsive on selection; target translation feedback within 3 seconds and vocabulary draft generation within 5 seconds in normal network conditions

**Constraints**: Keep the feature scoped to one selected word at a time, reuse the existing passage detail and vocabulary form surfaces, avoid new global state libraries, and keep all server-only translation/AI calls off the client

**Scale/Scope**: Single passage detail screen, one popup menu, one translation action, one draft-generation action, and one prefilled add-vocabulary dialog flow

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Next.js App Router: pass. The feature stays inside `app/` and extends existing client/server boundaries.
- Firebase as source of truth: pass. Existing persistence remains in Firebase-backed routes and services.
- No tests: pass. Validation stays on `pnpm lint` only.
- Simplicity and YAGNI: pass. The feature reuses the current passage detail page and vocabulary dialog instead of adding a new state layer.

## Project Structure

### Documentation (this feature)

```text
specs/003-word-action-menu/
├── plan.md
├── research.md
├── data-model.md
└── quickstart.md
```

### Source Code (repository root)

```text
app/
├── api/
│   ├── vocabulary/
│   │   └── route.ts
│   └── word-actions/
│       ├── draft/
│       │   └── route.ts
│       └── translate/
│           └── route.ts
└── dashboard/
    └── passages/
        └── [recordId]/
            ├── page.tsx
            ├── passage-panel.tsx
            └── vocabulary-panel.tsx

lib/
├── openrouter/
│   └── client.ts
└── word-actions/
    ├── draft.ts
    └── translate.ts
```

**Structure Decision**: Keep the interaction state in `app/dashboard/passages/[recordId]/page.tsx`, render the popup from `passage-panel.tsx`, and let `vocabulary-panel.tsx` own the add/edit dialog while accepting a generated draft from the page. Server-side helpers under `app/api/word-actions/*` and `lib/word-actions/*` will isolate translation and draft generation from the client.

## Complexity Tracking

No constitution violations require justification.
