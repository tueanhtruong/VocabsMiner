import { RefObject } from "react";

import { findHighlightRanges } from "@/app/dashboard/passages/[recordId]/highlight-utils";
import type { PassageParagraph } from "@/lib/query-hooks/translations";

import { ParagraphTranslation } from "./ParagraphTranslation";
import { PassageSegment } from "./types";
import { buildParagraphSegments, normalizeSelectedWord } from "./utils";

type PassageTextProps = {
  paragraphs: PassageParagraph[];
  selectedWord: string | null;
  showNoMatch: boolean;
  firstMatchRef: RefObject<HTMLElement | null>;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  triggerWord: string | null;
  onWordClick: (word: string, element: HTMLElement) => void;
  onSaveParagraphTranslation: (
    paragraphId: string,
    translation: string,
  ) => Promise<void>;
  onDeleteParagraphTranslation: (paragraphId: string) => Promise<void>;
  onGenerateParagraphTranslation: (paragraphId: string) => Promise<void>;
  onRegenerateParagraphTranslation: (paragraphId: string) => Promise<void>;
};

function splitToTokens(text: string): string[] {
  return text.split(/(\s+)/);
}

export function PassageText({
  paragraphs,
  selectedWord,
  showNoMatch,
  firstMatchRef,
  scrollContainerRef,
  triggerWord,
  onWordClick,
  onSaveParagraphTranslation,
  onDeleteParagraphTranslation,
  onGenerateParagraphTranslation,
  onRegenerateParagraphTranslation,
}: PassageTextProps) {
  const handleTokenClick = (token: string, element: HTMLElement) => {
    const normalizedWord = normalizeSelectedWord(token);

    if (!normalizedWord) {
      return;
    }

    onWordClick(normalizedWord, element);
  };

  return (
    <div
      ref={scrollContainerRef}
      className="mt-3 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto lg:pr-1"
    >
      <div
        className={`whitespace-pre-wrap text-md leading-8 text-gray-700 ${showNoMatch && selectedWord ? "mt-3" : ""}`}
      >
        {paragraphs.map((paragraph) => {
          const paragraphRanges = selectedWord
            ? findHighlightRanges(paragraph.sourceText, selectedWord)
            : [];
          const paragraphSegments: PassageSegment[] =
            paragraphRanges.length > 0
              ? buildParagraphSegments(paragraph.sourceText, paragraphRanges)
              : [{ text: paragraph.sourceText, highlighted: false }];
          const firstHighlightedSegmentIndex = paragraphSegments.findIndex(
            (segment) => segment.highlighted,
          );

          return (
            <section
              key={paragraph.paragraphId}
              aria-label={`Paragraph ${paragraph.index + 1}`}
              className="mb-6 last:mb-0"
            >
              {paragraphSegments.map((segment, segIndex) => {
                const tokens = splitToTokens(segment.text);
                const isFirstHighlightedSeg =
                  segIndex === firstHighlightedSegmentIndex;
                const firstWordTokenIndex = tokens.findIndex(
                  (t) => t.length > 0 && !/^\s+$/.test(t),
                );

                return tokens.map((token, tokenIndex) => {
                  const key = `${segIndex}-${tokenIndex}`;

                  if (!token || /^\s+$/.test(token)) {
                    if (/\n{1,}/.test(token)) {
                      return (
                        <span key={key} aria-hidden>
                          <span className="block h-3" />
                          <span className="block h-3" />
                        </span>
                      );
                    }

                    return <span key={key}>{token}</span>;
                  }

                  const isTrigger =
                    triggerWord != null &&
                    normalizeSelectedWord(token).toLowerCase() ===
                      triggerWord.toLowerCase();

                  const isFirstWordRef =
                    isFirstHighlightedSeg && tokenIndex === firstWordTokenIndex;

                  if (segment.highlighted) {
                    return (
                      <mark
                        key={key}
                        ref={isFirstWordRef ? firstMatchRef : null}
                        className={`rounded px-0.5 text-gray-900 cursor-pointer underline-offset-2 hover:underline transition-all ${
                          isTrigger ? "bg-blue-200" : "bg-yellow-200"
                        }`}
                        onClick={(e) =>
                          handleTokenClick(token, e.currentTarget)
                        }
                      >
                        {token}
                      </mark>
                    );
                  }

                  return (
                    <span
                      key={key}
                      className={`rounded cursor-pointer underline-offset-2 hover:underline transition-all ${
                        isTrigger
                          ? "bg-blue-100 text-blue-900 px-0.5"
                          : "hover:text-gray-900"
                      }`}
                      onClick={(e) => handleTokenClick(token, e.currentTarget)}
                    >
                      {token}
                    </span>
                  );
                });
              })}
              <ParagraphTranslation
                paragraph={paragraph}
                onSave={(translation) =>
                  onSaveParagraphTranslation(paragraph.paragraphId, translation)
                }
                onDelete={() =>
                  onDeleteParagraphTranslation(paragraph.paragraphId)
                }
                onGenerate={() =>
                  onGenerateParagraphTranslation(paragraph.paragraphId)
                }
                onRegenerate={() =>
                  onRegenerateParagraphTranslation(paragraph.paragraphId)
                }
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}
