"use client";

import { useMemo } from "react";

import { ApiClientError } from "@/lib/query-hooks/api-client";
import {
  usePassageHistoryInfiniteQuery,
  useVocabularyHistoryInfiniteQuery,
} from "@/lib/query-hooks/history";

const sectionPageSize = 10;

export function HistoryPanel() {
  const passagesQuery = usePassageHistoryInfiniteQuery(sectionPageSize);
  const vocabularyQuery = useVocabularyHistoryInfiniteQuery(sectionPageSize);

  const passages = useMemo(
    () => (passagesQuery.data?.pages ?? []).flatMap((page) => page.items),
    [passagesQuery.data?.pages],
  );

  const vocabulary = useMemo(
    () => (vocabularyQuery.data?.pages ?? []).flatMap((page) => page.items),
    [vocabularyQuery.data?.pages],
  );

  const error =
    (passagesQuery.error instanceof ApiClientError
      ? passagesQuery.error.message
      : null) ??
    (vocabularyQuery.error instanceof ApiClientError
      ? vocabularyQuery.error.message
      : null);

  const isLoadingPassages = passagesQuery.isLoading;
  const isLoadingVocabulary = vocabularyQuery.isLoading;

  return (
    <section className="space-y-4">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-gray-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Passage History
          </h2>
          <ul className="mt-3 space-y-2">
            {passages.map((item) => (
              <li
                key={item.passageId}
                className="rounded-lg bg-gray-50 p-3 transition hover:bg-gray-100"
              >
                <p className="text-sm text-gray-700">{item.previewText}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {new Date(item.createdAt).toLocaleString()} •{" "}
                  {item.vocabularyCount} word
                  {item.vocabularyCount > 1 ? "s" : ""}
                </p>
              </li>
            ))}
          </ul>

          {!isLoadingPassages && !passages.length ? (
            <p className="mt-3 text-sm text-gray-600">No passages yet.</p>
          ) : null}

          {passagesQuery.hasNextPage ? (
            <button
              type="button"
              onClick={() => void passagesQuery.fetchNextPage()}
              disabled={passagesQuery.isFetchingNextPage}
              className="mt-3 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 transition hover:border-indigo-600 hover:bg-indigo-50 disabled:opacity-60"
            >
              {passagesQuery.isFetchingNextPage
                ? "Loading..."
                : "Load more passages"}
            </button>
          ) : null}
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Vocabulary Timeline
          </h2>
          <ul className="mt-3 space-y-2">
            {vocabulary.map((item) => (
              <li
                key={item.vocabularyId}
                className="rounded-lg bg-gray-50 p-3 transition hover:bg-gray-100"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-gray-900">{item.word}</p>
                  <span className="text-xs text-gray-500">
                    {item.occurrenceCount} hit
                    {item.occurrenceCount > 1 ? "s" : ""}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-700">{item.definition}</p>
                <p className="mt-1 text-xs text-gray-500">
                  Last seen {new Date(item.lastSeenAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>

          {!isLoadingVocabulary && !vocabulary.length ? (
            <p className="mt-3 text-sm text-gray-600">No vocabulary yet.</p>
          ) : null}

          {vocabularyQuery.hasNextPage ? (
            <button
              type="button"
              onClick={() => void vocabularyQuery.fetchNextPage()}
              disabled={vocabularyQuery.isFetchingNextPage}
              className="mt-3 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 transition hover:border-indigo-600 hover:bg-indigo-50 disabled:opacity-60"
            >
              {vocabularyQuery.isFetchingNextPage
                ? "Loading..."
                : "Load more vocabulary"}
            </button>
          ) : null}
        </article>
      </div>
    </section>
  );
}
