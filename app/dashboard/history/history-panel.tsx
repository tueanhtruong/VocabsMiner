"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ApiClientError } from "@/lib/query-hooks/api-client";
import {
  usePassageHistoryQuery,
  useVocabularyHistoryQuery,
} from "@/lib/query-hooks/history";

const PAGE_SIZE = 10;

export function HistoryPanel() {
  const passagesQuery = usePassageHistoryQuery();
  const vocabularyQuery = useVocabularyHistoryQuery();

  const [passageSearch, setPassageSearch] = useState("");
  const [passagePage, setPassagePage] = useState(1);
  const [vocabSearch, setVocabSearch] = useState("");
  const [vocabPage, setVocabPage] = useState(1);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allPassages = passagesQuery.data ?? [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allVocabulary = vocabularyQuery.data ?? [];

  const filteredPassages = useMemo(() => {
    const q = passageSearch.trim().toLowerCase();
    if (!q) return allPassages;
    return allPassages.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.previewText.toLowerCase().includes(q),
    );
  }, [allPassages, passageSearch]);

  const filteredVocabulary = useMemo(() => {
    const q = vocabSearch.trim().toLowerCase();
    if (!q) return allVocabulary;
    return allVocabulary.filter(
      (item) =>
        item.word.toLowerCase().includes(q) ||
        item.definition.toLowerCase().includes(q),
    );
  }, [allVocabulary, vocabSearch]);

  const passageTotalPages = Math.max(
    1,
    Math.ceil(filteredPassages.length / PAGE_SIZE),
  );
  const safePassagePage = Math.min(passagePage, passageTotalPages);
  const passages = useMemo(
    () =>
      filteredPassages.slice(
        (safePassagePage - 1) * PAGE_SIZE,
        safePassagePage * PAGE_SIZE,
      ),
    [filteredPassages, safePassagePage],
  );

  const vocabTotalPages = Math.max(
    1,
    Math.ceil(filteredVocabulary.length / PAGE_SIZE),
  );
  const safeVocabPage = Math.min(vocabPage, vocabTotalPages);
  const vocabulary = useMemo(
    () =>
      filteredVocabulary.slice(
        (safeVocabPage - 1) * PAGE_SIZE,
        safeVocabPage * PAGE_SIZE,
      ),
    [filteredVocabulary, safeVocabPage],
  );

  const error =
    (passagesQuery.error instanceof ApiClientError
      ? passagesQuery.error.message
      : null) ??
    (vocabularyQuery.error instanceof ApiClientError
      ? vocabularyQuery.error.message
      : null);

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
          <input
            type="search"
            value={passageSearch}
            onChange={(e) => {
              setPassageSearch(e.target.value);
              setPassagePage(1);
            }}
            placeholder="Search passages..."
            className="mt-3 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
          />
          <ul className="mt-3 space-y-2">
            {passages.map((item) => (
              <li
                key={item.recordId}
                className="rounded-lg bg-gray-50 p-3 transition hover:bg-gray-100"
              >
                <Link href={`/dashboard/passages/${item.recordId}`}>
                  <p className="text-sm font-semibold text-gray-900">
                    {item.title}
                  </p>
                  <p className="text-sm text-gray-700">{item.previewText}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(item.createdAt).toLocaleString()} •{" "}
                    {item.vocabularyCount} word
                    {item.vocabularyCount > 1 ? "s" : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          {!passagesQuery.isLoading && !filteredPassages.length ? (
            <p className="mt-3 text-sm text-gray-600">
              {passageSearch
                ? "No passages match your search."
                : "No passages yet."}
            </p>
          ) : null}

          {passageTotalPages > 1 ? (
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-xs text-gray-500">
                Page {safePassagePage} of {passageTotalPages}
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setPassagePage((p) => Math.max(1, p - 1))}
                  disabled={safePassagePage === 1}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-indigo-600 hover:bg-indigo-50 disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPassagePage((p) => Math.min(passageTotalPages, p + 1))
                  }
                  disabled={safePassagePage === passageTotalPages}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-indigo-600 hover:bg-indigo-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Vocabulary Timeline
          </h2>
          <input
            type="search"
            value={vocabSearch}
            onChange={(e) => {
              setVocabSearch(e.target.value);
              setVocabPage(1);
            }}
            placeholder="Search vocabulary..."
            className="mt-3 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
          />
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

          {!vocabularyQuery.isLoading && !filteredVocabulary.length ? (
            <p className="mt-3 text-sm text-gray-600">
              {vocabSearch
                ? "No vocabulary matches your search."
                : "No vocabulary yet."}
            </p>
          ) : null}

          {vocabTotalPages > 1 ? (
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-xs text-gray-500">
                Page {safeVocabPage} of {vocabTotalPages}
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setVocabPage((p) => Math.max(1, p - 1))}
                  disabled={safeVocabPage === 1}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-indigo-600 hover:bg-indigo-50 disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setVocabPage((p) => Math.min(vocabTotalPages, p + 1))
                  }
                  disabled={safeVocabPage === vocabTotalPages}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-indigo-600 hover:bg-indigo-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </article>
      </div>
    </section>
  );
}
