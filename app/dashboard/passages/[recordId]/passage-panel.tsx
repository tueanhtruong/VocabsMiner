"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { HighlightRange } from "@/app/dashboard/passages/[recordId]/highlight-utils";

type PassagePanelProps = {
  passage: string;
  selectedWord: string | null;
  highlightedRanges: HighlightRange[];
  showNoMatch: boolean;
  onSelectWord: (word: string) => void;
  onGenerateVocabularyDraft: (word: string) => Promise<void>;
};

type PopupState = {
  word: string;
  top: number;
  left: number;
};

export function PassagePanel({
  passage,
  selectedWord,
  highlightedRanges,
  showNoMatch,
  onSelectWord,
  onGenerateVocabularyDraft,
}: PassagePanelProps) {
  const firstMatchRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [popupState, setPopupState] = useState<PopupState | null>(null);
  const [translation, setTranslation] = useState<string | null>(null);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);

  const extractVietnameseText = (payload: unknown): string | null => {
    if (!Array.isArray(payload) || !Array.isArray(payload[0])) {
      return null;
    }

    const translated = (payload[0] as unknown[])
      .map((chunk) => {
        if (!Array.isArray(chunk) || typeof chunk[0] !== "string") {
          return "";
        }

        return chunk[0];
      })
      .join("")
      .trim();

    return translated || null;
  };

  const segments = useMemo(() => {
    if (!highlightedRanges.length) {
      return [{ text: passage, highlighted: false }];
    }

    const sorted = [...highlightedRanges].sort((a, b) => a.start - b.start);
    const nextSegments: Array<{ text: string; highlighted: boolean }> = [];
    let cursor = 0;

    for (const range of sorted) {
      if (range.start > cursor) {
        nextSegments.push({
          text: passage.slice(cursor, range.start),
          highlighted: false,
        });
      }

      nextSegments.push({
        text: passage.slice(range.start, range.end),
        highlighted: true,
      });
      cursor = range.end;
    }

    if (cursor < passage.length) {
      nextSegments.push({
        text: passage.slice(cursor),
        highlighted: false,
      });
    }

    return nextSegments;
  }, [highlightedRanges, passage]);

  useEffect(() => {
    if (!selectedWord || highlightedRanges.length === 0) {
      return;
    }

    firstMatchRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  }, [highlightedRanges.length, selectedWord]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;

      if (containerRef.current?.contains(target)) {
        return;
      }

      setPopupState(null);
      setTranslation(null);
      setTranslationError(null);
      setIsTranslating(false);
      setIsGeneratingDraft(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (!popupState?.word) {
      return;
    }

    const controller = new AbortController();

    const runTranslation = async () => {
      setIsTranslating(true);
      setTranslation(null);
      setTranslationError(null);

      try {
        const url = new URL(
          "https://translate.googleapis.com/translate_a/single",
        );
        url.searchParams.set("client", "gtx");
        url.searchParams.set("sl", "auto");
        url.searchParams.set("tl", "vi");
        url.searchParams.set("dt", "t");
        url.searchParams.set("q", popupState.word);

        const response = await fetch(url.toString(), {
          method: "GET",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to translate.");
        }

        const payload = (await response.json()) as unknown;
        const vietnamese = extractVietnameseText(payload);

        if (!vietnamese) {
          throw new Error("Translation returned no text.");
        }

        setTranslation(vietnamese);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setTranslation(null);
        setTranslationError(
          error instanceof Error ? error.message : "Unable to translate.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsTranslating(false);
        }
      }
    };

    void runTranslation();

    return () => {
      controller.abort();
    };
  }, [popupState?.word]);

  const captureSelection = () => {
    const selection = window.getSelection();
    const rawSelection = selection?.toString().trim();

    if (!rawSelection || !containerRef.current) {
      return;
    }

    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;

    if (
      !range ||
      !containerRef.current.contains(range.commonAncestorContainer)
    ) {
      return;
    }

    const rect = range.getBoundingClientRect();

    if (!rect.width && !rect.height) {
      return;
    }

    onSelectWord(rawSelection);
    setPopupState({
      word: rawSelection,
      top: rect.bottom + 8,
      left: Math.min(window.innerWidth - 280, Math.max(16, rect.left)),
    });
    setTranslation(null);
    setTranslationError(null);
  };

  const handleGenerateDraft = async () => {
    if (!popupState) {
      return;
    }

    setIsGeneratingDraft(true);

    try {
      await onGenerateVocabularyDraft(popupState.word);
      setPopupState(null);
      setTranslation(null);
      setTranslationError(null);
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  return (
    <article
      ref={containerRef}
      className="sticky top-18 self-start rounded-2xl border border-gray-200 bg-white p-5 lg:max-h-[calc(100vh-4.5rem)]"
    >
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Passage</h2>
        {showNoMatch && selectedWord ? (
          <span className="text-sm text-red-600 font-semibold">
            No direct match was found for &quot;{selectedWord}&quot; in this
            passage.
          </span>
        ) : null}
      </div>

      <div className="mt-3 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto lg:pr-1">
        <div
          className={`whitespace-pre-wrap text-sm leading-7 text-gray-700 ${showNoMatch && selectedWord ? "mt-3" : ""}`}
          onMouseUp={captureSelection}
          onTouchEnd={captureSelection}
        >
          {(() => {
            let highlightedIndex = 0;

            return segments.map((segment, index) => {
              if (!segment.highlighted) {
                return <span key={`segment-${index}`}>{segment.text}</span>;
              }

              const shouldAttachRef = highlightedIndex === 0;
              highlightedIndex += 1;

              return (
                <mark
                  key={`highlight-${index}`}
                  className="rounded bg-yellow-200 px-0.5 text-gray-900"
                  ref={shouldAttachRef ? firstMatchRef : null}
                >
                  {segment.text}
                </mark>
              );
            });
          })()}
        </div>
      </div>

      {popupState ? (
        <div
          className="fixed z-50 w-72 rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl"
          style={{ top: popupState.top, left: popupState.left }}
          role="dialog"
          aria-label="Word actions"
        >
          <div className="space-y-2">
            <button
              type="button"
              disabled
              className="w-full cursor-default rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-left text-sm font-medium text-indigo-900 disabled:opacity-100"
            >
              {isTranslating
                ? "Translating..."
                : translation
                  ? translation
                  : "Translate to Vietnamese"}
            </button>

            <button
              type="button"
              onClick={handleGenerateDraft}
              disabled={isGeneratingDraft}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-sm font-medium text-gray-800 transition hover:bg-gray-50 disabled:opacity-50"
            >
              {isGeneratingDraft
                ? "Preparing vocabulary draft..."
                : "Create vocabulary draft"}
            </button>

            {translationError ? (
              <p className="text-xs text-red-600">{translationError}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}
