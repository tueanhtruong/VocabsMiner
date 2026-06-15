# Feature Specification: Vocab Extraction Authentication

**Feature Branch**: `[001-vocab-extraction-auth]`

**Created**: 2026-06-14

**Status**: Draft

**Input**: User description: "I want to build a web NextJS app that allow user Paste any dense reading passage into VocabMiner app and let openrouter AI instantly extract, define, and contextualize the high-impact academic vocabulary you need to hit Band 6+, transform passive reading into a list of personal vocabulary in seconds. My app use Firebase service and require user to login with email before using it core value. After login successfully, my app get id from user profile as use as a key, store to firebase data user info and future vocabulary list."

## Clarifications

### Session 2026-06-14

- Q: Which authentication methods are supported for login? -> A: Google sign-in only.
- Q: What history data must be visible in user profile? -> A: Both reading passage history and vocabulary list history.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Secure Access To Core Feature (Priority: P1)

As a learner, I can sign in with Google before using vocabulary extraction so my personal vocabulary data is tied to my account and private.

**Why this priority**: Google login is the gate to all core value and ensures every extraction is associated with the correct learner identity.

**Independent Test**: Can be fully tested by signing in with Google, confirming successful access to extraction, and confirming unauthenticated users cannot start extraction.

**Acceptance Scenarios**:

1. **Given** a visitor is not authenticated, **When** they attempt to use vocabulary extraction, **Then** they are prompted to sign in with Google first.
2. **Given** a learner signs in successfully with Google, **When** sign-in completes, **Then** the learner can access the passage input and extraction flow.
3. **Given** a learner signs in successfully, **When** the profile is loaded, **Then** the system associates the learner profile identifier with their account record.

---

### User Story 2 - Extract Academic Vocabulary From Passage (Priority: P2)

As a learner, I can paste a dense reading passage and receive a curated list of high-impact academic words with definitions and in-passage context, so I can quickly build Band 6+ vocabulary.

**Why this priority**: This is the primary user value proposition and the central reason the product exists.

**Independent Test**: Can be fully tested by submitting a qualifying passage and confirming the returned list contains academic vocabulary items, definitions, and contextual usage linked to the submitted text.

**Acceptance Scenarios**:

1. **Given** an authenticated learner has entered a valid passage, **When** they request extraction, **Then** the system returns a vocabulary list containing target words, plain-language definitions, and contextualized usage.
2. **Given** an authenticated learner submits a passage with limited extractable academic vocabulary, **When** extraction completes, **Then** the system returns either a small list or a clear no-results outcome.
3. **Given** extraction results are generated, **When** they are shown to the learner, **Then** each item is understandable and actionable for study.

---

### User Story 3 - Build Personal Vocabulary Bank (Priority: P3)

As a learner, I can save extracted vocabulary items under my account so I can accumulate a personal vocabulary bank over multiple reading sessions.

**Why this priority**: Persistent storage enables long-term progress and turns one-time extraction into a continuing learning system.

**Independent Test**: Can be fully tested by running extraction across multiple passages while authenticated and verifying that saved items are retrievable under the same account profile identifier.

**Acceptance Scenarios**:

1. **Given** an authenticated learner receives extraction results, **When** results are stored, **Then** saved vocabulary items are linked to that learner profile identifier.
2. **Given** the learner returns later and signs in with the same Google account, **When** they open their vocabulary collection, **Then** prior saved items are available.

---

### User Story 4 - Review Personal Learning History (Priority: P3)

As a learner, I can view my reading passage history and vocabulary history in my profile so I can review what I have studied over time.

**Why this priority**: History visibility strengthens retention and helps learners continue from previous reading sessions.

**Independent Test**: Can be fully tested by completing multiple extraction sessions, opening profile history, and confirming reading passages and related vocabulary entries are listed for the authenticated learner.

**Acceptance Scenarios**:

1. **Given** an authenticated learner has past extraction sessions, **When** they open profile history, **Then** they can view prior reading passages.
2. **Given** an authenticated learner has saved vocabulary over time, **When** they open profile history, **Then** they can view their vocabulary list history.

### Edge Cases

- What happens when a learner submits an empty, extremely short, or non-language passage?
- How does the system handle Google sign-in failures or user-cancelled Google consent?
- What happens when extraction returns zero high-impact academic words?
- How does the system behave when storage fails after extraction is successful?
- How are duplicate vocabulary items handled when the same word appears across multiple passages?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST require Google-based authentication before allowing access to vocabulary extraction.
- **FR-002**: System MUST allow a signed-in learner to submit a reading passage for vocabulary extraction.
- **FR-003**: System MUST identify and return high-impact academic vocabulary items from the submitted passage.
- **FR-004**: System MUST provide a learner-friendly definition for each returned vocabulary item.
- **FR-005**: System MUST provide contextualized usage for each returned vocabulary item based on the submitted passage.
- **FR-006**: System MUST associate each learner account with a stable profile identifier after successful sign-in.
- **FR-007**: System MUST store learner profile data keyed by the learner profile identifier.
- **FR-008**: System MUST store extracted vocabulary items under the learner profile identifier for future retrieval.
- **FR-009**: System MUST allow authenticated learners to retrieve previously saved vocabulary items tied to their own profile identifier.
- **FR-010**: System MUST prevent one learner from accessing another learner's profile data or vocabulary list.
- **FR-011**: System MUST provide clear user-facing feedback for authentication failures, extraction failures, and storage failures.
- **FR-012**: System MUST handle repeated submissions of the same vocabulary item without corrupting the learner's vocabulary collection.
- **FR-013**: System MUST store each learner reading passage submission as history tied to the learner profile identifier.
- **FR-014**: System MUST provide a profile history view that shows both reading passage history and vocabulary list history for the authenticated learner.

### Key Entities _(include if feature involves data)_

- **Learner Account**: Represents an authenticated user identity from Google sign-in and associated profile identifier.
- **Learner Profile**: Represents stored learner metadata keyed by the profile identifier and used as ownership anchor for personal data.
- **Extraction Request**: Represents one submitted reading passage and its processing lifecycle.
- **Vocabulary Item**: Represents one extracted academic term with meaning and context derived from the passage.
- **Vocabulary Collection**: Represents all vocabulary items saved for a learner profile across multiple extraction requests.
- **Reading Passage History**: Represents a chronological record of submitted reading passages tied to a learner profile.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of core extraction attempts are blocked for unauthenticated visitors.
- **SC-002**: At least 95% of successful sign-in attempts grant access to extraction in under 10 seconds.
- **SC-003**: At least 90% of valid passage submissions return extraction results (or explicit no-results outcomes) in under 15 seconds.
- **SC-004**: At least 90% of sampled extracted items are judged by reviewers as relevant academic vocabulary for intermediate-to-upper-intermediate learners.
- **SC-005**: At least 95% of saved vocabulary items are successfully retrievable by the same learner in subsequent sessions.
- **SC-006**: 0 confirmed incidents of cross-account vocabulary visibility.
- **SC-007**: At least 95% of learners with prior activity can load profile history containing both reading passages and vocabulary records in under 5 seconds.

## Assumptions

- Target users are English learners seeking to improve academic vocabulary for banded proficiency goals such as Band 6+.
- Core value includes sign-in, extraction, and personal vocabulary persistence; advanced analytics and gamification are out of scope for this feature.
- A learner profile identifier is available immediately after successful authentication and is suitable as the primary ownership key for learner data.
- Google is the only supported sign-in method for this feature release.
- The extraction service can process plain pasted text passages in common reading lengths.
- The first release prioritizes web usage on modern browsers with stable internet connectivity.
