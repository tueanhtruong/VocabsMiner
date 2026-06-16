type ExtractionVocabularyItem = {
  word: string;
  definition: string;
  context: string;
};

type ExtractionResultProps = {
  vocabulary: ExtractionVocabularyItem[];
  isSubmitted: boolean;
};

export function ExtractionResult({
  vocabulary,
  isSubmitted,
}: ExtractionResultProps) {
  if (!isSubmitted) {
    return null;
  }

  if (!vocabulary.length) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <h2 className="text-base font-semibold text-gray-900">
          No vocabulary found in this passage
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Your passage is still saved. You can open it from Passage History and
          try another extraction with a denser academic text.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-gray-900">
        Extraction Results
      </h2>
      <ul className="space-y-3">
        {vocabulary.map((item, index) => (
          <li
            key={`${item.word}-${index}`}
            className="rounded-2xl border border-gray-200 bg-white p-4"
          >
            <h3 className="text-base font-semibold text-gray-900">
              {item.word}
            </h3>
            <p className="mt-1 text-sm text-gray-700">{item.definition}</p>
            <p className="mt-2 text-xs leading-5 text-gray-500">
              {item.context}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
