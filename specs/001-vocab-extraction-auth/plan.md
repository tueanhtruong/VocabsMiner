# Implementation Plan: Vocab Extraction Authentication

**Branch**: `[001-vocab-extraction-auth]` | **Date**: 2026-06-14 | **Spec**: /specs/001-vocab-extraction-auth/spec.md

**Input**: Feature specification from `/specs/001-vocab-extraction-auth/spec.md`

## Summary

Build a Next.js 16 App Router web flow where users authenticate with Google via Firebase Auth before any extraction action, submit reading passages for OpenRouter-powered academic vocabulary extraction, and persist both passage history and vocabulary history in user-scoped Firestore records keyed by Firebase UID.

## Technical Context

**Language/Version**: TypeScript 5, React 19, Next.js 16 App Router

**Primary Dependencies**: next, react, react-dom, firebase (Auth + Firestore), OpenRouter HTTP API

**Storage**: Firestore (user profile, reading passage history, vocabulary history)

**Testing**: None — lint only (`pnpm lint` must exit 0 after every task per constitution)

**Target Platform**: Modern desktop/mobile web browsers via Next.js web app

**Project Type**: Web application (single Next.js project)

**Performance Goals**:

- Successful sign-in to ready state within 10 seconds (SC-002)
- Passage extraction response (or explicit no-results) within 15 seconds for valid inputs (SC-003)
- Profile history load under 5 seconds for users with prior activity (SC-007)

**Constraints**:

- Google sign-in only (no email/password flow)
- Firebase is the only backend source of truth
- OpenRouter API key must remain server-side only
- Per-user data isolation must be enforced by Firestore Security Rules
- YAGNI-first implementation (no speculative abstractions)

**Scale/Scope**:

- Initial release scope: authentication gate, extraction, save/retrieve vocabulary, profile history views
- Expected scale: early-stage product usage with pagination-ready history access patterns

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Pre-Phase 0 Gate Review

- Principle I (Next.js App Router + TS + Tailwind): PASS
- Principle II (Firebase-only backend + encapsulated service access): PASS
- Principle III (No tests, lint required): PASS
- Principle IV (Simplicity and YAGNI): PASS

No violations identified. Proceeding to research.

### Post-Phase 1 Re-Check

- Design artifacts maintain Firebase as sole auth/data backend: PASS
- Contracts keep OpenRouter calls in server-side boundary only: PASS
- Data model enforces UID-keyed ownership and isolation constraints: PASS
- No test infrastructure introduced; lint-only quality gate retained: PASS

No constitution violations after design.

## Project Structure

### Documentation (this feature)

```text
specs/001-vocab-extraction-auth/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── extraction-api.md
└── tasks.md
```

### Source Code (repository root)

```text
app/
├── layout.tsx
├── page.tsx
├── login/
├── dashboard/
└── api/
    └── extract/

lib/
├── firebase/
│   ├── client.ts
│   ├── admin.ts
│   └── firestore-service.ts
├── auth/
│   └── session.ts
└── openrouter/
    └── client.ts

middleware.ts
```

**Structure Decision**: Keep a single Next.js App Router project. Add focused service modules under `lib/firebase`, `lib/auth`, and `lib/openrouter` to satisfy constitution encapsulation rules while keeping implementation minimal.

## Complexity Tracking

No constitution violations requiring justification.
