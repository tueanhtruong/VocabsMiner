"use client";

import { useMemo } from "react";
import Link from "next/link";

import { ApiClientError } from "@/lib/query-hooks/api-client";
import { useSidebarPassageHistoryInfiniteQuery } from "@/lib/query-hooks/history";

const pageSize = 20;

export function VocabularyList() {
  const passagesQuery = useSidebarPassageHistoryInfiniteQuery(pageSize);

  const items = useMemo(
    () => (passagesQuery.data?.pages ?? []).flatMap((page) => page.items ?? []),
    [passagesQuery.data?.pages],
  );

  const error =
    passagesQuery.error instanceof ApiClientError
      ? passagesQuery.error.message
      : passagesQuery.error
        ? "We could not load your passage history."
        : null;

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex flex-col gap-1">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Passage History
          </h2>
          <p className="text-sm text-gray-600">
            Re-open your saved passages and continue vocabulary review.
          </p>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.recordId}
              className="rounded-lg border border-gray-200 bg-gray-50 p-3 transition hover:bg-gray-100"
            >
              <Link
                href={`/dashboard/passages/${item.recordId}`}
                className="block"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <span className="text-xs text-gray-500">
                    {item.vocabularyCount} word
                    {item.vocabularyCount > 1 ? "s" : ""}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-gray-700">
                  {item.previewText}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!passagesQuery.isLoading && !error && items.length === 0 ? (
        <p className="text-sm text-gray-600">
          No passages have been saved yet.
        </p>
      ) : null}

      <div className="flex gap-2">
        {passagesQuery.hasNextPage ? (
          <button
            type="button"
            onClick={() => void passagesQuery.fetchNextPage()}
            disabled={passagesQuery.isFetchingNextPage}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 transition hover:border-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
          >
            {passagesQuery.isFetchingNextPage
              ? "Loading..."
              : "Load more passages"}
          </button>
        ) : null}
      </div>
    </section>
  );
}
