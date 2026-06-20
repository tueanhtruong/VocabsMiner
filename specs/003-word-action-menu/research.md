# Research: Word Action Menu

## Decision 1: Use `@vitalets/google-translate-api` behind a server-side route

- Decision: Add a server-only translation helper and call it from an App Router API route rather than importing translation logic into the client.
- Rationale: The dependency is Node-oriented, the feature already uses route-based data flow, and server-side translation keeps the browser bundle small and avoids exposing any external service details in the client.
- Alternatives considered: Client-side translation call, direct OpenRouter translation, or a shared browser utility. Those options were rejected because the requested library is server-friendly, and translation is a single focused action that fits the existing API boundary pattern.

## Decision 2: Generate vocabulary drafts with OpenRouter in structured JSON

- Decision: Use the existing OpenRouter integration style to request a strict JSON draft containing the fields the add vocabulary form already expects.
- Rationale: The repository already has a reliable OpenRouter extraction pipeline and a matching vocabulary schema, so reusing that pattern minimizes new concepts and keeps the draft payload aligned with the existing form.
- Alternatives considered: Hard-coded heuristic drafting, saving the draft automatically, or building a separate freeform note flow. Those options were rejected because the feature needs AI-assisted field completion, not a new persistence model.

## Decision 3: Keep selection and draft state in the passage detail page

- Decision: Manage the selected word, popup state, translation result, and draft payload in `app/dashboard/passages/[recordId]/page.tsx`, then pass data down to `passage-panel.tsx` and `vocabulary-panel.tsx`.
- Rationale: The detail page already coordinates passage highlighting and vocabulary actions, so extending that page keeps the flow local and avoids a new global state layer.
- Alternatives considered: React context, a dedicated store, or putting the state into the vocabulary panel. Those options were rejected because the current page already owns the navigation and selection lifecycle and the feature only needs one local interaction path.

## Decision 4: Reuse the existing vocabulary save route

- Decision: Keep final saving on the current `POST /api/vocabulary` route and only prefill the form for later user review.
- Rationale: The add vocabulary route already validates and persists the required fields, so the new feature should stop at draft generation and avoid duplicating save logic.
- Alternatives considered: Adding a new save endpoint or auto-saving the draft immediately. Those options were rejected because the user explicitly wants to review and save later.
