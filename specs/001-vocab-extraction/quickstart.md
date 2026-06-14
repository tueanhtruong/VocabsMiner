# Quickstart Validation Guide: AI Vocabulary Extraction

**Feature**: 001-vocab-extraction | **Date**: 2026-06-12

This guide walks through the end-to-end validation scenarios that prove each user story
is working correctly. It is not a test suite — it is a manual validation checklist to run
after implementation is complete.

---

## Prerequisites

1. **Node ≥ 20** and **pnpm** installed
2. A Firebase project with Auth (Email/Password provider enabled) and Firestore set up
3. An OpenAI API key with access to `gpt-4o-mini`
4. A `.env.local` file at the project root with all required variables (see
   [Environment Variables](#environment-variables) below)
5. Firestore security rules deployed (see `firestore.rules` in the repo root)

---

## Environment Variables

Create `.env.local` at the repo root:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=<your-firebase-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-project>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your-project-id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your-project>.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<your-app-id>
OPENAI_API_KEY=sk-proj-<your-openai-key>
```

---

## Setup & Run

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev
# → App available at http://localhost:3000
```

---

## Validation Scenarios

### Story 1 — Extract Vocabulary (P1)

**Goal**: Any visitor can paste a passage and receive a vocabulary list.

#### Scenario 1.1 — Successful extraction

1. Open `http://localhost:3000` (no sign-in required).
2. Paste the sample passage below into the text area:

   > *"The ubiquitous proliferation of digital technologies has fundamentally
   > transformed contemporary society, engendering unprecedented opportunities for
   > communication and collaboration while simultaneously exacerbating pre-existing
   > socioeconomic inequalities. Scholars and policymakers alike grapple with the
   > ramifications of this pervasive shift, particularly with regard to educational
   > attainment and labour market participation among marginalised communities."*

3. Click **Extract**.
4. ✅ **Expected**: A list of 5–20 vocabulary items appears within 10 seconds.
5. ✅ **Each item shows**: word, part of speech badge, definition, contextual sentence
   in italics, and a band relevance label (B7/B8/B9).

#### Scenario 1.2 — Too-short passage

1. Type fewer than 50 words in the text area (e.g., "The cat sat on the mat.").
2. ✅ **Expected**: The "Extract" button is disabled and/or an inline message reads
   "Passage must be at least 50 words…" — no API call is made.

#### Scenario 1.3 — Too-long passage

1. Paste text exceeding 2,000 words.
2. ✅ **Expected**: The "Extract" button is disabled and/or an inline message states
   the 2,000-word limit has been exceeded.

#### Scenario 1.4 — No Band 7+ vocabulary

1. Paste a passage of everyday simple English (50+ words of very basic sentences:
   "I went to the shop. I bought some food. It was a nice day.").
2. Click **Extract**.
3. ✅ **Expected**: A result set with a note that no Band 7+ vocabulary was detected;
   no crash or blank screen.

#### Scenario 1.5 — AI service error (manual test)

1. Temporarily set `OPENAI_API_KEY=invalid-key` in `.env.local` and restart the server.
2. Paste a valid passage and click **Extract**.
3. ✅ **Expected**: A descriptive error message appears; the pasted text is preserved.
4. Restore the correct API key and restart.

---

### Story 2 — Save Vocabulary Items (P2)

**Goal**: Authenticated users can save and un-save items.

#### Scenario 2.1 — Save a word (authenticated)

1. Sign in (navigate to `/auth/sign-in` or use the sign-in link in the header).
2. Return to the home page, paste a passage, and click **Extract**.
3. Click **Save** on any vocabulary item.
4. ✅ **Expected**: The button changes to "Saved ✓" (disabled or visually distinct).
5. Navigate away and return to the home page.
6. Run the same extraction again — the saved word should still show "Saved ✓".

#### Scenario 2.2 — Save prompt for unauthenticated user

1. Sign out (or use a private/incognito window).
2. Extract a passage and click **Save** on an item.
3. ✅ **Expected**: The app shows a prompt or message directing the user to sign in
   before saving.

#### Scenario 2.3 — Duplicate save

1. Signed in, extract a passage.
2. Click **Save** on a word that is already in your collection.
3. ✅ **Expected**: No duplicate entry is created in Firestore; the UI shows "Saved ✓".

#### Scenario 2.4 — Remove a saved word

1. Navigate to `/goldmine`.
2. Click **Remove** on any saved item.
3. ✅ **Expected**: The item disappears from the collection immediately; it is removed
   from Firestore.

---

### Story 3 — Review Saved Collection (P3)

**Goal**: Authenticated users can view their Vocabulary Goldmine.

#### Scenario 3.1 — View collection

1. Sign in and save at least one word (see Story 2 above).
2. Navigate to `/goldmine`.
3. ✅ **Expected**: All saved words are displayed with word, part of speech, definition,
   and contextual sentence.

#### Scenario 3.2 — Empty state

1. Sign in with an account that has no saved words (or remove all words).
2. Navigate to `/goldmine`.
3. ✅ **Expected**: An empty-state message is shown (e.g., "No words saved yet —
   extract your first passage to start building your goldmine!").

#### Scenario 3.3 — Unauthenticated access to Goldmine

1. Sign out.
2. Directly navigate to `http://localhost:3000/goldmine`.
3. ✅ **Expected**: Redirected to `/auth/sign-in`.

#### Scenario 3.4 — Cross-session persistence

1. Sign in, save a word, and then sign out.
2. Sign back in.
3. Navigate to `/goldmine`.
4. ✅ **Expected**: The previously saved word is still present (persisted in Firestore).

---

### Story 4 — User Authentication (P4)

**Goal**: New and returning users can register, sign in, and sign out.

#### Scenario 4.1 — Register new account

1. Navigate to `/auth/sign-up`.
2. Enter a valid email and a password (min 6 characters per Firebase default).
3. Submit the form.
4. ✅ **Expected**: Account is created; user is signed in automatically and redirected
   to the home page. The header shows the authenticated state.

#### Scenario 4.2 — Sign in with correct credentials

1. Sign out (if signed in).
2. Navigate to `/auth/sign-in`.
3. Enter the credentials used in 4.1.
4. Submit.
5. ✅ **Expected**: User is signed in and can access `/goldmine`.

#### Scenario 4.3 — Sign in with wrong credentials

1. Navigate to `/auth/sign-in`.
2. Enter a valid email with an incorrect password (or an unregistered email).
3. Submit.
4. ✅ **Expected**: A generic error message is shown (e.g., "Invalid email or
   password.") — does not reveal whether the email is registered (FR-012).

#### Scenario 4.4 — Sign out

1. Sign in.
2. Click **Sign Out** in the header.
3. ✅ **Expected**: Signed out; redirected to (or still on) the home page as a guest;
   navigation shows "Sign In / Sign Up" links; `/goldmine` redirects to sign-in.

---

## Lint Gate

After all validation passes, confirm the lint gate is clean:

```bash
pnpm lint
# → must exit with code 0
```

Any lint errors indicate incomplete implementation and must be resolved before the
feature is considered done.

---

## References

- API contract: [`contracts/api.md`](./contracts/api.md)
- Data model: [`data-model.md`](./data-model.md)
- Feature spec: [`spec.md`](./spec.md)
- Implementation plan: [`plan.md`](./plan.md)
