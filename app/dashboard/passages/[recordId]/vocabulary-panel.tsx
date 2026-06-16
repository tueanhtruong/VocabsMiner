export type DetailVocabularyItem = {
  word: string;
  definition: string;
  context: string;
};

type VocabularyPanelProps = {
  vocabularyList: DetailVocabularyItem[];
  selectedWord: string | null;
  onSelectWord: (word: string) => void;
};

export function VocabularyPanel({
  vocabularyList,
  selectedWord,
  onSelectWord,
}: VocabularyPanelProps) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-gray-900">Vocabulary</h2>

      {!vocabularyList.length ? (
        <p className="mt-3 text-sm text-gray-600">
          No vocabulary was extracted for this passage.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {vocabularyList.map((item, index) => {
            const isSelected = selectedWord === item.word;

            return (
              <li key={`${item.word}-${index}`}>
                <button
                  type="button"
                  onClick={() => onSelectWord(item.word)}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                    isSelected
                      ? "border-indigo-400 bg-indigo-50"
                      : "border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50"
                  }`}
                >
                  <p className="font-semibold text-gray-900">{item.word}</p>
                  <p className="mt-1 text-sm text-gray-700">
                    {item.definition}
                  </p>
                  {item.context ? (
                    <p className="mt-2 text-xs text-gray-500">{item.context}</p>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
