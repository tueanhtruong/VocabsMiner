"use client";

import { useQuery } from "@tanstack/react-query";

import { requestJson } from "@/lib/query-hooks/api-client";

export type PassageHistoryItem = {
  recordId: string;
  title: string;
  previewText: string;
  createdAt: string;
  vocabularyCount: number;
};

export type SidebarPassageHistoryItem = Pick<
  PassageHistoryItem,
  "recordId" | "title" | "createdAt" | "vocabularyCount" | "previewText"
>;

export type VocabularyHistoryItem = {
  vocabularyId: string;
  word: string;
  definition: string;
  lastSeenAt: string;
  occurrenceCount: number;
};

type ProfileHistoryResponse = {
  uid: string;
  passages: PassageHistoryItem[];
  vocabulary: VocabularyHistoryItem[];
  next: {
    passagesCursor: string | null;
    vocabularyCursor: string | null;
  };
};

async function getProfileHistoryPage(params: {
  passagesLimit?: number;
  vocabularyLimit?: number;
}) {
  const url = new URL("/api/profile/history", window.location.origin);

  if (params.passagesLimit !== undefined) {
    url.searchParams.set("passagesLimit", String(params.passagesLimit));
  }

  if (params.vocabularyLimit !== undefined) {
    url.searchParams.set("vocabularyLimit", String(params.vocabularyLimit));
  }

  return requestJson<ProfileHistoryResponse>(url.toString(), { method: "GET" });
}

export function usePassageHistoryQuery() {
  return useQuery({
    queryKey: ["history", "passages"],
    queryFn: () => getProfileHistoryPage({}),
    select: (data) => data.passages,
  });
}

export function useSidebarPassageHistoryQuery() {
  return useQuery({
    queryKey: ["history", "passages"],
    queryFn: () => getProfileHistoryPage({}),
    select: (data) =>
      data.passages.map(
        (item): SidebarPassageHistoryItem => ({
          recordId: item.recordId,
          title: item.title,
          previewText: item.previewText,
          createdAt: item.createdAt,
          vocabularyCount: item.vocabularyCount,
        }),
      ),
  });
}

export function useVocabularyHistoryQuery() {
  return useQuery({
    queryKey: ["history", "vocabulary"],
    queryFn: () => getProfileHistoryPage({}),
    select: (data) => data.vocabulary,
  });
}
