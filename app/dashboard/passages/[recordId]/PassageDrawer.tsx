"use client";

import { Drawer } from "@mantine/core";

import { PassagePanel } from "@/app/dashboard/passages/[recordId]/PassagePanel";
import type { HighlightRange } from "@/app/dashboard/passages/[recordId]/highlight-utils";

type PassageDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passage: string;
  vocabularyWords: string[];
  selectedWord: string | null;
  highlightedRanges: HighlightRange[];
  showNoMatch: boolean;
  onGenerateVocabularyDraft: (word: string) => Promise<void>;
  title?: string;
};

export function PassageDrawer({
  open,
  onOpenChange,
  passage,
  vocabularyWords,
  selectedWord,
  highlightedRanges,
  showNoMatch,
  onGenerateVocabularyDraft,
  title,
}: PassageDrawerProps) {
  return (
    <Drawer.Root
      opened={open}
      onClose={() => onOpenChange(false)}
      position="left"
      size="40rem"
    >
      <Drawer.Overlay className="lg:hidden" />
      <Drawer.Content
        aria-label="Passage drawer"
        className="lg:hidden m-0 h-full overflow-y-auto"
      >
        <Drawer.Header
          className="flex items-center justify-between border-b border-gray-200"
          style={{ zIndex: 1550 }}
        >
          <Drawer.Title>
            <h3 className="text-lg font-semibold text-gray-900">
              {title || "Passage"}
            </h3>
          </Drawer.Title>
          <Drawer.CloseButton aria-label="Close drawer" />
        </Drawer.Header>
        <Drawer.Body style={{ paddingBlockStart: 8 }}>
          <PassagePanel
            passage={passage}
            vocabularyWords={vocabularyWords}
            selectedWord={selectedWord}
            highlightedRanges={highlightedRanges}
            showNoMatch={showNoMatch}
            onGenerateVocabularyDraft={onGenerateVocabularyDraft}
          />
        </Drawer.Body>
      </Drawer.Content>
    </Drawer.Root>
  );
}
