"use client";

type PassageDetailErrorProps = {
  error: Error;
  reset: () => void;
};

export default function PassageDetailError({
  error,
  reset,
}: PassageDetailErrorProps) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3 px-6 py-10">
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error.message || "Unable to load passage details."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="w-fit rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 transition hover:border-indigo-600 hover:bg-indigo-50"
      >
        Try again
      </button>
    </main>
  );
}
