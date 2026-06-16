# Implementation Plan: Vocabulary Extraction & History Flow

**Branch**: `[002-vocabulary-history-flow]` | **Date**: 2026-06-16 | **Spec**: /specs/002-vocabulary-history-flow/spec.md

**Input**: Feature specification from `/specs/002-vocabulary-history-flow/spec.md`

## Summary

Implement a streamlined extraction-to-review flow where authenticated users submit a passage title and reading passage on the dashboard, receive extracted vocabulary, persist the result under their user profile, and are redirected to a two-panel detail page with click-to-highlight vocabulary context. Navigation is simplified by removing the standalone history route and surfacing user-scoped passage history in the sidebar.

## Technical Context

**Language/Version**: TypeScript 5, React 19, Next.js 16 App Router

**Primary Dependencies**: next, react, react-dom, firebase (Auth + Firestore), OpenRouter API integration modules, ESLint 9

**Storage**: Firestore user-scoped documents/collections for passage extraction records

**Testing**: None — lint only (`pnpm lint` must exit 0 after every task per constitution)

**Target Platform**: Web application for modern desktop/mobile browsers

**Project Type**: Single Next.js App Router web application

**Performance Goals**:

- Successful extraction-save-detail redirect in <= 5 seconds for successful requests (SC-002)
- Correct history-to-detail navigation on first attempt for >= 98% of selections (SC-003)
- Highlight response after vocabulary click with perceived immediate UI feedback (target < 150ms local interaction)

**Constraints**:

- Extraction submission requires both title and passage inputs
- Firebase remains sole auth/data backend
- Per-user data isolation must be maintained for history and detail retrieval
- No additional state libraries or speculative abstractions (YAGNI)
- Lint-only quality gate applies before completion

**Scale/Scope**:

- Initial scope includes dashboard extraction form changes, detail page interaction behavior, and sidebar/navigation restructuring
- User data scope is per-account passage extraction history and associated vocabulary lists

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Pre-Phase 0 Gate Review

- Principle I (Next.js App Router + TS + Tailwind): PASS
- Principle II (Firebase-only auth/data, service encapsulation): PASS
- Principle III (No tests, lint quality gate): PASS
- Principle IV (Simplicity and YAGNI): PASS

No constitution violations identified. Proceed to Phase 0 research.

### Post-Phase 1 Re-Check

- Design artifacts keep feature in existing Next.js App Router boundaries: PASS
- Data model and contracts enforce user-scoped ownership for records/history: PASS
- Validation plan keeps lint-only quality process and introduces no tests: PASS
- Documentation scope remains minimal and feature-focused: PASS

No constitution violations after Phase 1 design.

## Project Structure

### Documentation (this feature)

```text
specs/002-vocabulary-history-flow/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── extraction-history-flow-api.md
└── tasks.md
```

### Source Code (repository root)

```text
app/
├── dashboard/
│   ├── page.tsx
│   ├── extraction-result.tsx
│   ├── vocabulary-list.tsx
│   ├── extraction-status.tsx
│   └── history/
│       ├── page.tsx
│       └── history-panel.tsx
├── api/
│   ├── extract/route.ts
│   ├── profile/history/route.ts
│   └── vocabulary/route.ts
└── layout.tsx

lib/
├── firebase/
│   └── firestore-service.ts
├── query-hooks/
│   ├── extraction.ts
│   └── history.ts
└── openrouter/
    └── extraction-schema.ts
```

**Structure Decision**: Use the existing single-project Next.js App Router layout and update current dashboard/detail/navigation modules in place. Keep persistence and retrieval logic in existing Firebase service/query hook boundaries.

## Complexity Tracking

No constitution violations requiring justification.
