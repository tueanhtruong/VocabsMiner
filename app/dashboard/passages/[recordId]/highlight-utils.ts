export type HighlightRange = {
  start: number;
  end: number;
};

function isAlphaNumeric(char: string | undefined) {
  return Boolean(char && /[a-z0-9]/i.test(char));
}

function normalizeTerm(term: string) {
  return term.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function toNormalizedPassage(passage: string) {
  const normalizedChars: string[] = [];
  const originalIndexByNormalizedIndex: number[] = [];

  for (let index = 0; index < passage.length; index += 1) {
    const char = passage[index];

    if (!isAlphaNumeric(char)) {
      continue;
    }

    normalizedChars.push(char.toLowerCase());
    originalIndexByNormalizedIndex.push(index);
  }

  return {
    normalizedPassage: normalizedChars.join(""),
    originalIndexByNormalizedIndex,
  };
}

export function findHighlightRanges(
  passage: string,
  selectedWord: string,
): HighlightRange[] {
  const normalizedWord = normalizeTerm(selectedWord);

  if (!normalizedWord) {
    return [];
  }

  const { normalizedPassage, originalIndexByNormalizedIndex } =
    toNormalizedPassage(passage);

  if (!normalizedPassage) {
    return [];
  }

  const ranges: HighlightRange[] = [];
  let searchStart = 0;

  while (searchStart < normalizedPassage.length) {
    const matchAt = normalizedPassage.indexOf(normalizedWord, searchStart);

    if (matchAt < 0) {
      break;
    }

    const normalizedEnd = matchAt + normalizedWord.length - 1;
    const originalStart = originalIndexByNormalizedIndex[matchAt];
    const originalEndExclusive =
      originalIndexByNormalizedIndex[normalizedEnd] + 1;

    const before = passage[originalStart - 1];
    const after = passage[originalEndExclusive];
    const hasBoundaryBefore = !isAlphaNumeric(before);
    const hasBoundaryAfter = !isAlphaNumeric(after);

    if (hasBoundaryBefore && hasBoundaryAfter) {
      ranges.push({
        start: originalStart,
        end: originalEndExclusive,
      });
    }

    searchStart = matchAt + 1;
  }

  return ranges;
}
