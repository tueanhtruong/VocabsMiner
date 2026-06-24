"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ApiClientError } from "@/lib/query-hooks/api-client";
import { DeletePassageDialog } from "@/app/dashboard/DeletePassageDialog";
import {
  useDeletePassageHistoryMutation,
  useSidebarPassageHistoryQuery,
} from "@/lib/query-hooks/history";

const PAGE_SIZE = 10;

export function VocabularyList() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<{
    recordId: string;
    title: string;
  } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const passagesQuery = useSidebarPassageHistoryQuery();
  const deletePassageMutation = useDeletePassageHistoryMutation();

  const allItems = useMemo(
    () => passagesQuery.data ?? [],
    [passagesQuery.data],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.previewText.toLowerCase().includes(q),
    );
  }, [allItems, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const items = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );

  const error =
    passagesQuery.error instanceof ApiClientError
      ? passagesQuery.error.message
      : passagesQuery.error
        ? "Could not load your passage history."
        : null;

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  async function handleConfirmDeletePassage() {
    if (!deleteTarget) {
      return;
    }

    setDeleteError(null);

    try {
      await deletePassageMutation.mutateAsync(deleteTarget.recordId);
      setDeleteTarget(null);
    } catch (error) {
      setDeleteError(
        error instanceof ApiClientError
          ? error.message
          : "Unable to delete this passage. Please try again.",
      );
    }
  }

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

      <input
        type="search"
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search passages..."
        className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
      />

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.recordId}
              className="rounded-lg border border-gray-200 bg-gray-50 p-3 transition hover:bg-gray-100"
            >
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/dashboard/passages/${item.recordId}`}
                  className="block min-w-0 flex-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-md text-gray-900">
                      {item.title}
                    </h3>
                    <span className="text-sm text-gray-500 whitespace-nowrap leading-7 self-start">
                      {item.vocabularyCount} word
                      {item.vocabularyCount > 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-700">
                    {item.previewText}
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </Link>
                <button
                  type="button"
                  aria-label={`Delete ${item.title}`}
                  onClick={() => {
                    setDeleteError(null);
                    setDeleteTarget({
                      recordId: item.recordId,
                      title: item.title,
                    });
                  }}
                  className="rounded-md p-1.5 text-gray-500 transition hover:bg-red-100 hover:text-red-700"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path d="M4 7h16" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M6 7l1 12h10l1-12" />
                    <path d="M9 7V5h6v2" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!passagesQuery.isLoading && !error && filtered.length === 0 ? (
        <p className="text-sm text-gray-600">
          {search
            ? "No passages match your search."
            : "No passages have been saved yet."}
        </p>
      ) : null}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-2 pt-1">
          <p className="text-sm text-gray-500">
            Page {safePage} of {totalPages} &middot; {filtered.length} passages
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:border-indigo-600 hover:bg-indigo-50 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:border-indigo-600 hover:bg-indigo-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      <DeletePassageDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget?.title ?? null}
        isPending={deletePassageMutation.isPending}
        deleteError={deleteError}
        onClose={() => {
          console.log("Closing delete passage dialog");
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        onConfirm={handleConfirmDeletePassage}
      />
    </section>
  );
}
