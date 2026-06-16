import { useMemo } from "react";

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

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-gray-900">Passage</h2>
      {showNoMatch && selectedWord ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          No direct match was found for &quot;{selectedWord}&quot; in this
          passage.
        </p>
      ) : null}

      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-700">
        {segments.map((segment, index) =>
          segment.highlighted ? (
            <mark
              key={`highlight-${index}`}
              className="rounded bg-yellow-200 px-0.5 text-gray-900"
            >
              {segment.text}
            </mark>
          ) : (
            <span key={`segment-${index}`}>{segment.text}</span>
          ),
        )}
      </p>
    </article>
  );
}
