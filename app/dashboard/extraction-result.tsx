type ExtractionResultProps = {
  isSubmitted: boolean;
  isPending: boolean;
};

export function ExtractionResult({
  isSubmitted,
  isPending,
}: ExtractionResultProps) {
  if (!isSubmitted) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
      <h2 className="text-base font-semibold text-indigo-950">
        {isPending ? "Saving passage..." : "Extraction started"}
      </h2>
      <p className="mt-1 text-sm text-indigo-900">
        Your passage is saved immediately. Vocabulary extraction continues in
        the background, and the result will appear in Passage History.
      </p>
    </div>
  );
}
