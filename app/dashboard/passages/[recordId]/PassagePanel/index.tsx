"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { PassageText } from "./PassageText";
import { SelectionMenu } from "./SelectionMenu";
import { PassagePanelProps } from "./types";
import { useWordClick } from "./useWordClick";
import { useWordTranslation } from "./useWordTranslation";
import { buildPassageSegments, normalizeSelectedWord } from "./utils";

export function PassagePanel({
  passage,
  vocabularyWords,
  selectedWord,
  highlightedRanges,
  showNoMatch,
  onGenerateVocabularyDraft,
}: PassagePanelProps) {
  const firstMatchRef = useRef<HTMLElement | null>(null);
  const passageScrollRef = useRef<HTMLDivElement | null>(null);
  const { popupState, anchorEl, handleWordClick, resetPopupState } =
    useWordClick();
  const { translation, translationError, isTranslating } = useWordTranslation(
    popupState?.word ?? null,
  );
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);

  const isSelectedWordDuplicated = popupState?.word
    ? vocabularyWords.some((word) => {
        return (
          normalizeSelectedWord(word).toLowerCase() ===
          popupState.word.toLowerCase()
        );
      })
    : false;

  const segments = useMemo(() => {
    return buildPassageSegments(passage, highlightedRanges);
  }, [highlightedRanges, passage]);

  useEffect(() => {
    if (!selectedWord || highlightedRanges.length === 0) {
      return;
    }

    const target = firstMatchRef.current;
    const container = passageScrollRef.current;

    if (
      !target ||
      !container ||
      container.scrollHeight <= container.clientHeight
    ) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const targetOffsetInContainer =
      targetRect.top - containerRect.top + container.scrollTop;
    const scrollTo =
      targetOffsetInContainer -
      container.clientHeight / 2 +
      targetRect.height / 2;

    container.scrollTo({ top: Math.max(0, scrollTo), behavior: "smooth" });
  }, [highlightedRanges.length, selectedWord]);

  useEffect(() => {
    const el = anchorEl;
    const container = passageScrollRef.current;

    if (!el || !container) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          resetPopupState();
        }
      },
      { root: container, threshold: 0 },
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [anchorEl, resetPopupState]);

  const handleGenerateDraft = async () => {
    if (!popupState || isSelectedWordDuplicated) {
      return;
    }

    setIsGeneratingDraft(true);

    try {
      await onGenerateVocabularyDraft(popupState.word);
      resetPopupState();
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  return (
    <article className="sticky top-18 self-start rounded-2xl border border-gray-200 bg-white p-5 lg:max-h-[calc(100vh-4.5rem)]">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Passage</h2>
        {showNoMatch && selectedWord ? (
          <span className="text-sm text-red-600 font-semibold">
            No direct match was found for &quot;{selectedWord}&quot; in this
            passage.
          </span>
        ) : null}
      </div>

      <PassageText
        segments={segments}
        selectedWord={selectedWord}
        showNoMatch={showNoMatch}
        firstMatchRef={firstMatchRef}
        scrollContainerRef={passageScrollRef}
        triggerWord={popupState?.word ?? null}
        onWordClick={handleWordClick}
      />

      <SelectionMenu
        popupState={popupState}
        anchorEl={anchorEl}
        translation={translation}
        translationError={translationError}
        isTranslating={isTranslating}
        isGeneratingDraft={isGeneratingDraft}
        isSelectedWordDuplicated={isSelectedWordDuplicated}
        onClose={resetPopupState}
        onGenerateDraft={() => {
          void handleGenerateDraft();
        }}
      />
    </article>
  );
}
