import { HighlightRange } from "@/app/dashboard/passages/[recordId]/highlight-utils";
import type { PassageParagraph } from "@/lib/query-hooks/translations";

export type PassagePanelProps = {
  paragraphs: PassageParagraph[];
  vocabularyWords: string[];
  selectedWord: string | null;
  highlightedRanges: HighlightRange[];
  showNoMatch: boolean;
  onGenerateVocabularyDraft: (word: string) => Promise<void>;
  onSaveParagraphTranslation: (
    paragraphId: string,
    translation: string,
  ) => Promise<void>;
  onDeleteParagraphTranslation: (paragraphId: string) => Promise<void>;
  onGenerateParagraphTranslation: (paragraphId: string) => Promise<void>;
  onRegenerateParagraphTranslation: (paragraphId: string) => Promise<void>;
};

export type PopupState = {
  word: string;
};

export type PassageSegment = {
  text: string;
  highlighted: boolean;
};
