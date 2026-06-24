"use client";

import { Drawer, Portal } from "@chakra-ui/react";

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
      open={open}
      unmountOnExit
      onOpenChange={(details) => {
        onOpenChange(details.open);
      }}
      placement="start"
      size="lg"
    >
      {open ? (
        <Portal>
          <Drawer.Backdrop className="lg:hidden" />
          <Drawer.Positioner className="lg:hidden" alignItems="stretch">
            <Drawer.Content
              aria-label="Passage drawer"
              className="m-0 h-full overflow-y-auto rounded-none border-r border-gray-200 bg-gray-50 shadow-xl"
            >
              <Drawer.Header
                className="flex items-center justify-between border-b border-gray-200"
                paddingTop="3"
                paddingBottom="3"
                zIndex="1550"
              >
                <Drawer.Title className="text-lg font-semibold text-gray-900">
                  {title || "Passage"}
                </Drawer.Title>
                <Drawer.CloseTrigger asChild top="3" right="3">
                  <button
                    type="button"
                    aria-label="Close drawer"
                    className="rounded-md p-1 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-5 w-5"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </Drawer.CloseTrigger>
              </Drawer.Header>
              <Drawer.Body className="p-4" fontSize="md">
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
          </Drawer.Positioner>
        </Portal>
      ) : null}
    </Drawer.Root>
  );
}
