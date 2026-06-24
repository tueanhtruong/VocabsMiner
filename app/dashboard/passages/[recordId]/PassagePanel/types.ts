import { HighlightRange } from "@/app/dashboard/passages/[recordId]/highlight-utils";

export type PassagePanelProps = {
  passage: string;
  vocabularyWords: string[];
  selectedWord: string | null;
  highlightedRanges: HighlightRange[];
  showNoMatch: boolean;
  onGenerateVocabularyDraft: (word: string) => Promise<void>;
};

export type PopupState = {
  word: string;
};

export type PassageSegment = {
  text: string;
  highlighted: boolean;
};
