# Data Model: Vocabulary Extraction & History Flow

## Entity: PassageExtractionRecord

- Purpose: Canonical saved artifact for each successful extraction request.
- Primary Key: recordId
- Ownership Key: uid
- Fields:
  - recordId (string, required, immutable)
  - uid (string, required, immutable)
  - title (string, required)
  - passage (string, required)
  - vocabularyList (array<VocabularyItem>, required)
  - vocabularyCount (number, required)
  - createdAt (timestamp, required)
  - updatedAt (timestamp, required)
- Validation Rules:
  - title must be non-empty after trim
  - passage must be non-empty after trim
  - vocabularyList must be present; may be empty when extraction returns no terms
  - vocabularyCount must equal vocabularyList.length

## Entity: VocabularyItem

- Purpose: One extracted vocabulary term shown in detail panel and used for highlight selection.
- Parent: PassageExtractionRecord.vocabularyList[]
- Fields:
  - word (string, required)
  - definition (string, required)
  - context (string, optional)
  - level (string, optional)
  - confidence (number, optional)
- Validation Rules:
  - word and definition must be non-empty strings
  - confidence, if provided, must be numeric in accepted range [0, 1]

## Entity: PassageHistoryItem

- Purpose: Sidebar list representation of prior user extraction records.
- Derived From: PassageExtractionRecord
- Fields:
  - recordId (string, required)
  - title (string, required)
  - createdAt (timestamp, required)
  - vocabularyCount (number, required)
- Validation Rules:
  - all fields must originate from same user-owned record
  - records should be sorted by createdAt descending for display

## Entity: DetailViewSelectionState

- Purpose: UI state for mapping right-panel selection to left-panel highlights.
- Scope: client-side, non-persisted
- Fields:
  - selectedWord (string, nullable)
  - highlightedRanges (array<{ start: number; end: number }>, required default [])
  - hasMatch (boolean, required)
- Validation Rules:
  - hasMatch must reflect whether highlightedRanges has one or more entries
  - selectedWord null implies highlightedRanges is empty

## Relationships

- User (uid) 1:N PassageExtractionRecord
- PassageExtractionRecord 1:N VocabularyItem
- PassageExtractionRecord 1:1..N PassageHistoryItem (derived list view)
- DetailViewSelectionState references one active PassageExtractionRecord at a time

## State Transitions

### Extraction Save Flow

1. draft_input (title+passage incomplete)
2. ready_to_submit (both required inputs valid)
3. extracting (request in-flight)
4. extracted_not_saved (transient internal state)
5. saved (record persisted)
6. redirected_to_detail (detail page loaded)
7. failed_extraction OR failed_save (terminal error states with user feedback)

### Detail Highlight Flow

1. detail_loaded (no selected word)
2. word_selected
3. matched_highlighted OR no_match_feedback
4. new_word_selected (loop)

## Storage Layout (Planned)

- users/{uid}/passages/{recordId}
  - title
  - passage
  - vocabularyList
  - vocabularyCount
  - createdAt
  - updatedAt

The sidebar history list is generated from users/{uid}/passages ordered by createdAt.
