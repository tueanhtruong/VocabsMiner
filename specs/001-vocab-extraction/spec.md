# Feature Specification: AI Vocabulary Extraction from Reading Passages

**Feature Branch**: `001-vocab-extraction`

**Created**: 2026-06-12

**Status**: Draft

**Input**: User description: "Paste any dense reading passage into VocabMiner app and let AI instantly extract, define, and contextualize the high-impact academic vocabulary you need to hit Band 7+. Transform passive reading into your personal vocabulary goldmine in seconds."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Extract Vocabulary from Passage (Priority: P1)

A learner pastes a dense academic or IELTS-style reading passage into VocabsMiner. The app sends the text to an AI service which identifies and returns a ranked list of high-impact academic vocabulary — the words most likely to be tested at IELTS Band 7+ level. Each result includes the word, its definition in plain English, and the exact sentence from the passage where it appears.

**Why this priority**: This is the entire core value proposition of the app. Without this, the product does not exist. Every other story depends on this extraction step being functional.

**Independent Test**: A user with no account can paste a passage, submit it, and receive a list of extracted vocabulary items on screen — the feature delivers full value even without saving.

**Acceptance Scenarios**:

1. **Given** the user is on the home/extraction page, **When** they paste a passage of at least 50 words and click "Extract", **Then** the app displays a list of between 5 and 20 high-impact academic vocabulary items extracted from that passage.
2. **Given** the AI extraction is complete, **When** each item is displayed, **Then** it shows: the word, its part of speech, a clear definition, and the original sentence from the passage that contains the word.
3. **Given** the user submits a passage shorter than 50 words, **When** the extraction runs, **Then** the app shows a clear message explaining the passage is too short for meaningful extraction.
4. **Given** the user submits a passage containing no academic vocabulary above everyday level, **When** the extraction runs, **Then** the app returns a result set with a note that no Band 7+ vocabulary was detected.
5. **Given** the AI service is unavailable, **When** the user submits a passage, **Then** the app shows a descriptive error message and does not lose the pasted text.

---

### User Story 2 - Save Vocabulary Items to Personal Collection (Priority: P2)

An authenticated learner reviews the extracted vocabulary list and selects individual words to add to their personal "vocabulary goldmine" — a persistent collection stored under their account. Saved words can be revisited across sessions.

**Why this priority**: Saves the learner's progress and turns a one-off extraction into a long-term study asset. Requires P1 to be implemented first and requires Firebase authentication.

**Independent Test**: A logged-in user can save at least one word from an extraction result and then navigate away and return to see that word in their saved collection.

**Acceptance Scenarios**:

1. **Given** the user is authenticated and has extraction results visible, **When** they click "Save" on a vocabulary item, **Then** the item is added to their personal collection and the button state changes to indicate it is saved.
2. **Given** the user is not authenticated, **When** they attempt to save an item, **Then** the app prompts them to sign in before saving.
3. **Given** the user has already saved a word, **When** the same word appears in a new extraction result, **Then** the "Save" button shows the word is already in their collection.
4. **Given** the user wants to remove a saved word, **When** they click "Remove" on a saved item, **Then** the word is removed from their collection and no longer appears in the saved list.

---

### User Story 3 - Review Saved Vocabulary Collection (Priority: P3)

An authenticated learner navigates to their "Vocabulary Goldmine" view to review all previously saved words. Each item shows the word, its definition, and the original contextual sentence from the passage it was extracted from.

**Why this priority**: Transforms one-time extractions into a sustainable study resource. Valuable only when P2 is working and at least some words have been saved.

**Independent Test**: A logged-in user with at least one saved word can open the Goldmine page and see all their saved items with definitions and context.

**Acceptance Scenarios**:

1. **Given** the user is authenticated and has saved vocabulary items, **When** they navigate to the Goldmine page, **Then** all their saved words are displayed with word, part of speech, definition, and contextual sentence.
2. **Given** the user has no saved words, **When** they visit the Goldmine page, **Then** the page shows an empty-state message encouraging them to extract their first passage.
3. **Given** the user is not authenticated, **When** they try to access the Goldmine page, **Then** they are redirected to the sign-in page.

---

### User Story 4 - User Authentication (Priority: P4)

A new user creates an account or signs in with an existing account using email and password. Authentication gates access to the saving and collection features while allowing unauthenticated users to use the core extraction feature.

**Why this priority**: Required for P2 and P3 but the app can deliver its primary value (P1) without authentication. It is last because it is enabling infrastructure, not the core user value.

**Independent Test**: A new user can register, log in, and log out without being blocked from using the extraction feature.

**Acceptance Scenarios**:

1. **Given** a new visitor, **When** they register with a valid email and password, **Then** an account is created and they are signed in automatically.
2. **Given** a returning user, **When** they sign in with correct credentials, **Then** they are authenticated and can access their saved collection.
3. **Given** a user with incorrect credentials, **When** they attempt to sign in, **Then** a clear error message is shown without revealing whether the email exists.
4. **Given** an authenticated user, **When** they sign out, **Then** their session is ended and they are returned to the extraction page as a guest.

---

### Edge Cases

- What happens when the pasted passage is extremely long (e.g., 5,000+ words)? The app must either process it or clearly communicate a maximum length limit.
- How does the app handle passages in languages other than English? Display a clear message that only English passages are supported.
- What happens if the AI service returns malformed or empty data? Show a user-friendly error without crashing; preserve the pasted text so the user can retry.
- What happens if a user saves a word and then their session expires? The word must already be persisted to their account in Firestore before the session expires.
- What happens if two users save the same word from different passages? Each user's collection is independent; context sentence may differ between users.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The app MUST allow any visitor (authenticated or not) to paste a text passage and trigger AI vocabulary extraction.
- **FR-002**: The extraction process MUST identify between 5 and 20 high-impact academic vocabulary items ranked by relevance to Band 7+ academic English.
- **FR-003**: Each extracted vocabulary item MUST include: the word, its part of speech, a plain-English definition, and the original sentence from the passage.
- **FR-004**: The app MUST validate that the input passage meets a minimum length before sending it for extraction (minimum 50 words).
- **FR-005**: The app MUST display a meaningful error state when the AI service is unavailable, preserving the user's pasted text.
- **FR-006**: Authenticated users MUST be able to save individual vocabulary items to a persistent personal collection.
- **FR-007**: The app MUST prevent duplicate entries in a user's personal collection (same word cannot be saved twice).
- **FR-008**: Authenticated users MUST be able to remove individual items from their personal collection.
- **FR-009**: Authenticated users MUST be able to view all their saved vocabulary items in a dedicated "Vocabulary Goldmine" view.
- **FR-010**: Unauthenticated users who attempt to save a word MUST be prompted to sign in.
- **FR-011**: Users MUST be able to register with email and password, sign in, and sign out.
- **FR-012**: The sign-in error message MUST NOT reveal whether a specific email address is registered in the system.
- **FR-013**: The app MUST support passages of up to 2,000 words; passages exceeding this limit MUST receive a clear message with the limit stated.

### Key Entities

- **Passage**: A block of user-supplied text submitted for vocabulary extraction. Not persisted permanently; used transiently per session.
- **VocabItem**: A single extracted vocabulary word. Attributes: word (string), partOfSpeech (string), definition (string), contextSentence (string from original passage), bandRelevance (score or label), source passage excerpt.
- **SavedVocabEntry**: A VocabItem saved to a user's personal collection. Attributes: all VocabItem fields plus savedAt (timestamp), userId (owner reference). Stored in Firestore under the user's account.
- **User**: An authenticated individual. Attributes: userId (Firebase Auth UID), email, displayName. Owns zero or more SavedVocabEntry records.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A user can paste a passage and receive vocabulary results in under 10 seconds from the moment they click "Extract."
- **SC-002**: Each extraction returns at least 5 vocabulary items for any passage of 200 words or more.
- **SC-003**: A user can complete the full journey — paste passage, view results, save a word, view saved collection — in under 3 minutes on first use.
- **SC-004**: Authenticated users can access their saved vocabulary collection across different devices and sessions without any loss of data.
- **SC-005**: The extraction result is accurately contextualized — every displayed definition is accompanied by the exact sentence from the original passage.
- **SC-006**: New user registration and sign-in completes in under 30 seconds.

## Assumptions

- Target learners are IELTS candidates aiming for Band 7 or above, primarily working with academic English passages.
- The AI extraction is powered by a third-party large language model API (e.g., OpenAI) accessed server-side; the specific provider is an implementation detail.
- Email and password authentication is sufficient for v1; social login (Google, Apple) is out of scope.
- Mobile responsiveness is required; a dedicated mobile app is out of scope for v1.
- Passages are English-only; multi-language support is out of scope for v1.
- The app does not include spaced-repetition flashcard features in v1; the Goldmine is a read-only review list.
- No offline support is required; a stable internet connection is assumed.
- Maximum passage length is 2,000 words for v1; this limit balances AI cost and usability.
- Users own their saved vocabulary exclusively; there is no social/sharing feature in v1.
