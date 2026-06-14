<!--
## Sync Impact Report
- Version change: (none) → 1.0.0 (initial ratification)
- Added sections: Core Principles (×4), Technology Stack, Development Workflow, Governance
- Removed sections: N/A (initial)
- Templates updated:
  - .specify/templates/plan-template.md ✅ — Testing field guidance updated to "None — lint only"
  - .specify/templates/tasks-template.md ✅ — no test tasks guidance confirmed
  - .specify/templates/spec-template.md ✅ — no changes needed
- Follow-up TODOs: none
-->

# VocabsMiner Constitution

## Core Principles

### I. Next.js App Router — Frontend Foundation

All UI MUST be built with the Next.js App Router (`app/` directory) using React Server
Components by default. Client Components (`"use client"`) are permitted only when
interactivity or browser APIs are required. TypeScript is mandatory for all source files;
`any` types are forbidden unless explicitly justified inline. Tailwind CSS is the sole
styling mechanism — no external CSS-in-JS libraries.

### II. Firebase — Single Source of Truth

Firebase is the exclusive backend for authentication and data persistence. Authentication
MUST use Firebase Auth; no custom auth mechanisms are permitted. Firestore is the primary
database. Direct Firestore calls MUST be encapsulated in service modules under `lib/` and
MUST NOT be scattered across components. Firebase credentials MUST be sourced from
environment variables and MUST NOT be committed to version control.

### III. No Tests — Lint Is the Quality Gate (NON-NEGOTIABLE)

This project carries zero automated tests. The AI agent MUST run `pnpm lint` after
completing every task and MUST NOT mark a task complete until the command exits with
code `0`. Lint errors are treated as build-breaking failures. The lint command is:
`pnpm lint` (maps to `eslint`). Introducing test infrastructure or test files is
explicitly prohibited unless the constitution is amended.

### IV. Simplicity & YAGNI

Features MUST be implemented at the minimum viable scope. No speculative abstractions,
no premature generalizations. Shared utilities are only extracted when used in three or
more places. Complex state management libraries (Redux, Zustand, etc.) MUST NOT be
added without a documented rationale and constitution amendment.

## Technology Stack

- **Frontend Framework**: Next.js 16 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind CSS 4
- **Auth & Data**: Firebase Auth + Firestore
- **Package Manager**: pnpm (defined in `pnpm-workspace.yaml`)
- **Linting**: ESLint 9 with `eslint-config-next`
- **Node**: ≥ 20 (matching `@types/node` devDependency)
- **Prohibited**: test frameworks, CSS-in-JS, non-Firebase backend services

## Development Workflow

Every task executed by the AI agent MUST follow this sequence:

1. Implement the minimal change required by the task.
2. Run `pnpm lint` and resolve all reported issues.
3. Confirm lint exits `0` before marking the task complete.
4. Never commit environment variable values; use `.env.local` (gitignored).
5. Firebase service modules live in `lib/firebase/`; Auth helpers in `lib/auth/`.
6. All new Next.js pages go under `app/`; no `pages/` directory.

## Governance

This constitution supersedes all other project practices and documentation. Amendments
require: (1) a clear rationale in the pull request description, (2) an updated
`LAST_AMENDED_DATE` and incremented `CONSTITUTION_VERSION`, and (3) a review of
dependent templates (plan, spec, tasks) for consistency. All agent-generated plans and
tasks MUST include a Constitution Check gate before implementation begins.

**Version**: 1.0.0 | **Ratified**: 2026-06-12 | **Last Amended**: 2026-06-12
