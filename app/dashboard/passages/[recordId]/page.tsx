"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isPassageDrawerOpen, setIsPassageDrawerOpen] = useState(false);

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

  const handleAddVocabulary = async (formData: {
    word: string;
    type: string;
    phonetic: string;
    definition: string;
    context: string;
  }) => {
    try {
      const url = new URL("/api/vocabulary", window.location.origin);
      const response = await requestJson<{
        recordId: string;
        vocabulary: DetailVocabularyItem;
      }>(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId: params.recordId,
          ...formData,
        }),
      });

      // Update the cache with the new vocabulary at the top of the list
      queryClient.setQueryData(
        ["passage-detail", params.recordId],
        (oldData: PassageDetailResponse | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            vocabularyList: [response.vocabulary, ...oldData.vocabularyList],
          };
        },
      );
    } catch (error) {
      console.error("Failed to add vocabulary:", error);
      throw error;
    }
  };

  const handleUpdateVocabulary = async (
    index: number,
    formData: {
      word: string;
      type: string;
      phonetic: string;
      definition: string;
      context: string;
    },
  ) => {
    try {
      const url = new URL("/api/vocabulary", window.location.origin);
      const response = await requestJson<{
        recordId: string;
        index: number;
        vocabulary: DetailVocabularyItem;
      }>(url.toString(), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId: params.recordId,
          index,
          ...formData,
        }),
      });

      queryClient.setQueryData(
        ["passage-detail", params.recordId],
        (oldData: PassageDetailResponse | undefined) => {
          if (!oldData) {
            return oldData;
          }

          const updatedVocabularyList = [...oldData.vocabularyList];

          if (
            response.index < 0 ||
            response.index >= updatedVocabularyList.length
          ) {
            return oldData;
          }

          updatedVocabularyList[response.index] = response.vocabulary;

          return {
            ...oldData,
            vocabularyList: updatedVocabularyList,
          };
        },
      );
    } catch (error) {
      console.error("Failed to update vocabulary:", error);
      throw error;
    }
  };

  const handleDeleteVocabulary = async (index: number) => {
    const cacheKey = ["passage-detail", params.recordId] as const;
    const currentData =
      queryClient.getQueryData<PassageDetailResponse>(cacheKey);
    const deletedWord = currentData?.vocabularyList[index]?.word ?? null;

    try {
      const url = new URL("/api/vocabulary", window.location.origin);
      await requestJson<{
        recordId: string;
        index: number;
        deletedVocabulary: DetailVocabularyItem;
      }>(url.toString(), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId: params.recordId,
          index,
        }),
      });

      queryClient.setQueryData(
        cacheKey,
        (oldData: PassageDetailResponse | undefined) => {
          if (!oldData) {
            return oldData;
          }

          return {
            ...oldData,
            vocabularyList: oldData.vocabularyList.filter(
              (_, itemIndex) => itemIndex !== index,
            ),
          };
        },
      );

      if (deletedWord && selectedWord === deletedWord) {
        setSelectedWord(null);
      }
    } catch (error) {
      console.error("Failed to delete vocabulary:", error);
      throw error;
    }
  };

  const highlightedPassage = useMemo(() => {
    const passage = detailQuery.data?.passage ?? "";

    if (!selectedWord || !passage) {
      return [];
    }

    return findHighlightRanges(passage, selectedWord);
  }, [detailQuery.data?.passage, selectedWord]);

  const showNoMatch = Boolean(selectedWord) && highlightedPassage.length === 0;

  useEffect(() => {
    if (!isPassageDrawerOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPassageDrawerOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPassageDrawerOpen]);

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
        <h1
          className="truncate text-3xl font-semibold tracking-tight text-gray-900"
          title={detailQuery.data.title}
        >
          {detailQuery.data.title}
        </h1>
        <p className="text-sm text-gray-600">
          Saved {new Date(detailQuery.data.createdAt).toLocaleString()}
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="hidden md:block">
          <PassagePanel
            passage={detailQuery.data.passage}
            selectedWord={selectedWord}
            highlightedRanges={highlightedPassage}
            showNoMatch={showNoMatch}
          />
        </div>

        <div>
          <div className="mb-3 md:hidden">
            <button
              type="button"
              onClick={() => setIsPassageDrawerOpen(true)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              View Passage
            </button>
          </div>

          <VocabularyPanel
            vocabularyList={detailQuery.data.vocabularyList}
            selectedWord={selectedWord}
            onSelectWord={(word) => {
              setSelectedWord((currentWord) =>
                currentWord === word ? null : word,
              );

              if (window.matchMedia("(max-width: 767px)").matches) {
                setIsPassageDrawerOpen(true);
              }
            }}
            onAddVocabulary={handleAddVocabulary}
            onUpdateVocabulary={handleUpdateVocabulary}
            onDeleteVocabulary={handleDeleteVocabulary}
          />
        </div>
      </section>

      <div
        className={`fixed inset-0 z-50 md:hidden ${
          isPassageDrawerOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!isPassageDrawerOpen}
      >
        <button
          type="button"
          aria-label="Close passage drawer"
          onClick={() => setIsPassageDrawerOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity ${
            isPassageDrawerOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <aside
          className={`absolute left-0 top-0 h-full w-[min(90vw,28rem)] overflow-y-auto border-r border-gray-200 bg-gray-50 p-4 shadow-xl transition-transform ${
            isPassageDrawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Passage drawer"
        >
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={() => setIsPassageDrawerOpen(false)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Close
            </button>
          </div>

          <PassagePanel
            passage={detailQuery.data.passage}
            selectedWord={selectedWord}
            highlightedRanges={highlightedPassage}
            showNoMatch={showNoMatch}
          />
        </aside>
      </div>
    </main>
  );
}
