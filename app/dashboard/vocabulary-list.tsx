"use client";

import { FormEvent, useMemo, useState } from "react";

import { ApiClientError } from "@/lib/query-hooks/api-client";
import { useVocabularyInfiniteQuery } from "@/lib/query-hooks/vocabulary";

const pageSize = 20;

export function VocabularyList() {
  const [searchInput, setSearchInput] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const vocabularyQuery = useVocabularyInfiniteQuery({
    query: submittedQuery,
    pageSize,
  });

  const items = useMemo(
    () =>
      (vocabularyQuery.data?.pages ?? []).flatMap((page) => page.items ?? []),
    [vocabularyQuery.data?.pages],
  );

  const error =
    vocabularyQuery.error instanceof ApiClientError
      ? vocabularyQuery.error.message
      : vocabularyQuery.error
        ? "Unable to load vocabulary."
        : null;

  async function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedQuery(searchInput);
  }

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Vocabulary Bank
          </h2>
          <p className="text-sm text-gray-600">
            Review words extracted from your past passages.
          </p>
        </div>

        <form onSubmit={onSearch} className="flex w-full gap-2 sm:w-auto">
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Filter by word prefix"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 sm:w-56 transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:shadow-lg"
          >
            Search
          </button>
        </form>
      </div>

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.vocabularyId}
              className="rounded-lg border border-gray-200 bg-gray-50 p-3 transition hover:bg-gray-100"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-gray-900">{item.word}</h3>
                <span className="text-xs text-gray-500">
                  Seen {item.occurrenceCount} time
                  {item.occurrenceCount > 1 ? "s" : ""}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-700">{item.definition}</p>
              <p className="mt-2 text-xs text-gray-500">{item.context}</p>
            </li>
          ))}
        </ul>
      )}

      {!vocabularyQuery.isLoading && !error && items.length === 0 ? (
        <p className="text-sm text-gray-600">
          No vocabulary has been saved yet.
        </p>
      ) : null}

      <div className="flex gap-2">
        {vocabularyQuery.hasNextPage ? (
          <button
            type="button"
            onClick={() => void vocabularyQuery.fetchNextPage()}
            disabled={vocabularyQuery.isFetchingNextPage}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 transition hover:border-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
          >
            {vocabularyQuery.isFetchingNextPage ? "Loading..." : "Load more"}
          </button>
        ) : null}
      </div>
    </section>
  );
}
