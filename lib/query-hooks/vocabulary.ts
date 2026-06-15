"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { requestJson } from "@/lib/query-hooks/api-client";

export type VocabularyApiItem = {
  vocabularyId: string;
  word: string;
  definition: string;
  context: string;
  firstSeenAt: string;
  lastSeenAt: string;
  occurrenceCount: number;
};

type VocabularyResponse = {
  uid: string;
  items: VocabularyApiItem[];
  nextCursor: string | null;
};

type VocabularyPageParam = {
  cursor: string | null;
};

async function getVocabularyPage(params: {
  limit: number;
  query: string;
  cursor: string | null;
}) {
  const url = new URL("/api/vocabulary", window.location.origin);
  url.searchParams.set("limit", String(params.limit));

  if (params.cursor) {
    url.searchParams.set("cursor", params.cursor);
  }

  if (params.query.trim()) {
    url.searchParams.set("q", params.query.trim());
  }

  return requestJson<VocabularyResponse>(url.toString(), { method: "GET" });
}

export function useVocabularyInfiniteQuery(params: {
  query: string;
  pageSize: number;
}) {
  const normalizedQuery = params.query.trim();

  return useInfiniteQuery({
    queryKey: ["vocabulary", "list", normalizedQuery, params.pageSize],
    initialPageParam: { cursor: null } as VocabularyPageParam,
    queryFn: ({ pageParam }) =>
      getVocabularyPage({
        limit: params.pageSize,
        query: normalizedQuery,
        cursor: pageParam.cursor,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.nextCursor ? { cursor: lastPage.nextCursor } : undefined,
  });
}
