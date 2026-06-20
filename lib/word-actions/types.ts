export type SelectedWordActionInput = {
  recordId: string;
  passage: string;
  selectedWord: string;
};

export type TranslationActionResponse = {
  selectedWord: string;
  vietnamese: string;
};

export type VocabularyDraft = {
  recordId: string;
  sourceWord: string;
  word: string;
  type: string;
  phonetic: string;
  definition: string;
  vietnamese: string;
};

export type VocabularyDraftResponse = {
  draft: VocabularyDraft;
};