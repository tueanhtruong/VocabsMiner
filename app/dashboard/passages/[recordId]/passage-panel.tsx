import { useEffect, useMemo, useRef } from "react";

import { HighlightRange } from "@/app/dashboard/passages/[recordId]/highlight-utils";

type PassagePanelProps = {
  passage: string;
  selectedWord: string | null;
  highlightedRanges: HighlightRange[];
  showNoMatch: boolean;
};

export function PassagePanel({
  passage,
  selectedWord,
  highlightedRanges,
  showNoMatch,
}: PassagePanelProps) {
  const firstMatchRef = useRef<HTMLElement | null>(null);

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

  return (
    <article className="sticky top-18 self-start rounded-2xl border border-gray-200 bg-white p-5 lg:max-h-[calc(100vh-4.5rem)]">
      <h2 className="text-lg font-semibold text-gray-900">Passage</h2>

      <div className="mt-3 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto lg:pr-1">
        {showNoMatch && selectedWord ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            No direct match was found for &quot;{selectedWord}&quot; in this
            passage.
          </p>
        ) : null}

        <p
          className={`whitespace-pre-wrap text-sm leading-7 text-gray-700 ${showNoMatch && selectedWord ? "mt-3" : ""}`}
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
        </p>
      </div>
    </article>
  );
}
