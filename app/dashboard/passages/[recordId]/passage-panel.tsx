"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Menu, Portal } from "@chakra-ui/react";

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
  const anchorRangeRef = useRef<Range | null>(null);
  const [popupState, setPopupState] = useState<PopupState | null>(null);
  const [triggerPosition, setTriggerPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [translation, setTranslation] = useState<string | null>(null);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);

  const resetPopupState = () => {
    anchorRangeRef.current = null;
    setPopupState(null);
    setTriggerPosition(null);
    setTranslation(null);
    setTranslationError(null);
    setIsTranslating(false);
    setIsGeneratingDraft(false);
  };

  const syncTriggerPosition = () => {
    const range = anchorRangeRef.current;

    if (!range) {
      setTriggerPosition(null);
      return;
    }

    const rect = range.getBoundingClientRect();

    if (!rect.width && !rect.height) {
      setTriggerPosition(null);
      return;
    }

    setTriggerPosition((current) => {
      const next = {
        left: Math.max(8, rect.left),
        top: Math.max(8, rect.bottom + 8),
      };

      if (current && current.left === next.left && current.top === next.top) {
        return current;
      }

      return next;
    });
  };

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

  useEffect(() => {
    if (!popupState) {
      return;
    }

    let frameId = 0;

    const requestPositionSync = () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(() => {
        syncTriggerPosition();
      });
    };

    requestPositionSync();

    window.addEventListener("scroll", requestPositionSync, true);
    window.addEventListener("resize", requestPositionSync);

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      window.removeEventListener("scroll", requestPositionSync, true);
      window.removeEventListener("resize", requestPositionSync);
    };
  }, [popupState]);

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
    anchorRangeRef.current = range.cloneRange();
    setPopupState({
      word: rawSelection,
    });
    syncTriggerPosition();
    setTranslation(null);
    setTranslationError(null);
    setIsGeneratingDraft(false);
  };

  const handleGenerateDraft = async () => {
    if (!popupState) {
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

      <Menu.Root
        open={Boolean(popupState && triggerPosition)}
        onOpenChange={(details) => {
          if (!details.open) {
            resetPopupState();
          }
        }}
        positioning={{
          strategy: "fixed",
          placement: "bottom-start",
          gutter: 0,
        }}
      >
        <Menu.Trigger asChild>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            style={{
              position: "fixed",
              left: triggerPosition?.left ?? -9999,
              top: triggerPosition?.top ?? -9999,
              width: 1,
              height: 1,
              opacity: 0,
              pointerEvents: "none",
            }}
          />
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner zIndex="modal">
            <Menu.Content
              minW="18rem"
              rounded="xl"
              borderWidth="1px"
              borderColor="gray.200"
              bg="white"
              p="2"
              shadow="2xl"
            >
              <Menu.Item
                value="translated-word"
                disabled
                cursor="default"
                rounded="lg"
                borderWidth="1px"
                borderColor="blue.100"
                bg="blue.50"
                color="blue.900"
                fontSize="sm"
                fontWeight="medium"
                py="2"
              >
                {isTranslating
                  ? "Translating..."
                  : translation
                    ? translation
                    : "Translate to Vietnamese"}
              </Menu.Item>

              <Menu.Item
                value="create-vocabulary-draft"
                closeOnSelect={false}
                disabled={isGeneratingDraft}
                onSelect={() => {
                  void handleGenerateDraft();
                }}
                rounded="lg"
                borderWidth="1px"
                borderColor="gray.200"
                bg="white"
                color="gray.800"
                fontSize="sm"
                fontWeight="medium"
                py="2"
                _hover={{ bg: "gray.50" }}
                _disabled={{ opacity: 0.5 }}
              >
                {isGeneratingDraft
                  ? "Preparing vocabulary draft..."
                  : "Create vocabulary draft"}
              </Menu.Item>

              {translationError ? (
                <p className="px-2 pt-2 text-xs text-red-600">
                  {translationError}
                </p>
              ) : null}
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    </article>
  );
}
