import { RefObject } from "react";

import { PassageSegment } from "./types";
import { normalizeSelectedWord } from "./utils";

type PassageTextProps = {
  segments: PassageSegment[];
  selectedWord: string | null;
  showNoMatch: boolean;
  firstMatchRef: RefObject<HTMLElement | null>;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  triggerWord: string | null;
  onWordClick: (word: string, element: HTMLElement) => void;
};

function splitToTokens(text: string): string[] {
  return text.split(/(\s+)/);
}

export function PassageText({
  segments,
  selectedWord,
  showNoMatch,
  firstMatchRef,
  scrollContainerRef,
  triggerWord,
  onWordClick,
}: PassageTextProps) {
  const handleTokenClick = (token: string, element: HTMLElement) => {
    const normalizedWord = normalizeSelectedWord(token);

    if (!normalizedWord) {
      return;
    }

    onWordClick(normalizedWord, element);
  };

  const firstHighlightedSegmentIndex = segments.findIndex(
    (segment) => segment.highlighted,
  );

  return (
    <div
      ref={scrollContainerRef}
      className="mt-3 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto lg:pr-1"
    >
      <div
        className={`whitespace-pre-wrap text-md leading-8 text-gray-700 ${showNoMatch && selectedWord ? "mt-3" : ""}`}
      >
        {segments.map((segment, segIndex) => {
          const tokens = splitToTokens(segment.text);
          const isFirstHighlightedSeg =
            segIndex === firstHighlightedSegmentIndex;
          const firstWordTokenIndex = tokens.findIndex(
            (t) => t.length > 0 && !/^\s+$/.test(t),
          );

          return tokens.map((token, tokenIndex) => {
            const key = `${segIndex}-${tokenIndex}`;

            if (!token || /^\s+$/.test(token)) {
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
                  onClick={(e) => handleTokenClick(token, e.currentTarget)}
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
      </div>
    </div>
  );
}
