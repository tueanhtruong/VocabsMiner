"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { PassagePanel } from "@/app/dashboard/passages/[recordId]/passage-panel";
import {
  VocabularyPanel,
  type DetailVocabularyItem,
} from "@/app/dashboard/passages/[recordId]/vocabulary-panel";
import { ApiClientError, requestJson } from "@/lib/query-hooks/api-client";
import { findHighlightRanges } from "@/app/dashboard/passages/[recordId]/highlight-utils";

type PassageDetailResponse = {
  recordId: string;
  title: string;
  passage: string;
  vocabularyList: DetailVocabularyItem[];
  createdAt: string;
};

export default function PassageDetailPage() {
  const router = useRouter();
  const params = useParams<{ recordId: string }>();
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  const detailQuery = useQuery({
    queryKey: ["passage-detail", params.recordId],
    queryFn: async () => {
      const url = new URL("/api/vocabulary", window.location.origin);
      url.searchParams.set("recordId", params.recordId);
      return requestJson<PassageDetailResponse>(url.toString(), {
        method: "GET",
      });
    },
    enabled: Boolean(params.recordId),
  });

  const highlightedPassage = useMemo(() => {
    const passage = detailQuery.data?.passage ?? "";

    if (!selectedWord || !passage) {
      return [];
    }

    return findHighlightRanges(passage, selectedWord);
  }, [detailQuery.data?.passage, selectedWord]);

  const showNoMatch = Boolean(selectedWord) && highlightedPassage.length === 0;

  if (detailQuery.isLoading) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 px-6 py-10">
        <p className="text-sm text-gray-600">Loading passage details...</p>
      </main>
    );
  }

  if (detailQuery.error) {
    const errorMessage =
      detailQuery.error instanceof ApiClientError
        ? detailQuery.error.message
        : "Unable to load passage details.";

    if (
      detailQuery.error instanceof ApiClientError &&
      detailQuery.error.code === "NOT_FOUND"
    ) {
      return (
        <main className="mx-auto flex w-full max-w-6xl flex-1 px-6 py-10">
          <div className="w-full rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <p className="text-sm font-semibold">
              This passage no longer exists.
            </p>
            <p className="mt-1 text-sm">
              It may have been removed. Return to the dashboard and open another
              passage from your history.
            </p>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="mt-3 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
            >
              Back to Dashboard
            </button>
          </div>
        </main>
      );
    }

    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 px-6 py-10">
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      </main>
    );
  }

  if (!detailQuery.data) {
    return null;
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          {detailQuery.data.title}
        </h1>
        <p className="text-sm text-gray-600">
          Saved {new Date(detailQuery.data.createdAt).toLocaleString()}
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <PassagePanel
          passage={detailQuery.data.passage}
          selectedWord={selectedWord}
          highlightedRanges={highlightedPassage}
          showNoMatch={showNoMatch}
        />
        <VocabularyPanel
          vocabularyList={detailQuery.data.vocabularyList}
          selectedWord={selectedWord}
          onSelectWord={(word) =>
            setSelectedWord((currentWord) =>
              currentWord === word ? null : word,
            )
          }
        />
      </section>
    </main>
  );
}
