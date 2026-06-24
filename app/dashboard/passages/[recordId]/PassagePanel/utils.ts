import { HighlightRange } from "@/app/dashboard/passages/[recordId]/highlight-utils";

import { PassageSegment } from "./types";

export function buildPassageSegments(
  passage: string,
  highlightedRanges: HighlightRange[],
): PassageSegment[] {
  if (!highlightedRanges.length) {
    return [{ text: passage, highlighted: false }];
  }

  const sorted = [...highlightedRanges].sort((a, b) => a.start - b.start);
  const nextSegments: PassageSegment[] = [];
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
}

export function extractVietnameseText(payload: unknown): string | null {
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
}

function isWordBoundaryChar(char: string): boolean {
  return /[A-Za-z0-9]/.test(char);
}

export function normalizeSelectedWord(rawWord: string): string {
  const trimmed = rawWord.trim();

  if (!trimmed) {
    return "";
  }

  let start = 0;
  let end = trimmed.length - 1;

  while (start <= end && !isWordBoundaryChar(trimmed[start])) {
    start += 1;
  }

  while (end >= start && !isWordBoundaryChar(trimmed[end])) {
    end -= 1;
  }

  if (start > end) {
    return "";
  }

  return trimmed.slice(start, end + 1);
}
