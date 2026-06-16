"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

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

type CursorPageParam = {
  cursor: string | null;
};

async function getProfileHistoryPage(params: {
  sectionPageSize: number;
  passagesCursor?: string | null;
  vocabularyCursor?: string | null;
}) {
  const url = new URL("/api/profile/history", window.location.origin);
  url.searchParams.set("passagesLimit", String(params.sectionPageSize));
  url.searchParams.set("vocabularyLimit", String(params.sectionPageSize));

  if (params.passagesCursor) {
    url.searchParams.set("passagesCursor", params.passagesCursor);
  }

  if (params.vocabularyCursor) {
    url.searchParams.set("vocabularyCursor", params.vocabularyCursor);
  }

  return requestJson<ProfileHistoryResponse>(url.toString(), { method: "GET" });
}

export function usePassageHistoryInfiniteQuery(sectionPageSize: number) {
  return useInfiniteQuery({
    queryKey: ["history", "passages", sectionPageSize],
    initialPageParam: { cursor: null } as CursorPageParam,
    queryFn: ({ pageParam }) =>
      getProfileHistoryPage({
        sectionPageSize,
        passagesCursor: pageParam.cursor,
      }),
    getNextPageParam: (lastPage) => ({
      cursor: lastPage.next.passagesCursor,
    }),
    select: (data) => ({
      ...data,
      pages: data.pages.map((page) => ({
        items: page.passages,
        nextCursor: page.next.passagesCursor,
      })),
    }),
  });
}

export function useSidebarPassageHistoryInfiniteQuery(sectionPageSize: number) {
  return useInfiniteQuery({
    queryKey: ["history", "sidebar-passages", sectionPageSize],
    initialPageParam: { cursor: null } as CursorPageParam,
    queryFn: ({ pageParam }) =>
      getProfileHistoryPage({
        sectionPageSize,
        passagesCursor: pageParam.cursor,
      }),
    getNextPageParam: (lastPage) => ({
      cursor: lastPage.next.passagesCursor,
    }),
    select: (data) => ({
      ...data,
      pages: data.pages.map((page) => ({
        items: page.passages.map((item) => ({
          recordId: item.recordId,
          title: item.title,
          previewText: item.previewText,
          createdAt: item.createdAt,
          vocabularyCount: item.vocabularyCount,
        })) as SidebarPassageHistoryItem[],
        nextCursor: page.next.passagesCursor,
      })),
    }),
  });
}

export function useVocabularyHistoryInfiniteQuery(sectionPageSize: number) {
  return useInfiniteQuery({
    queryKey: ["history", "vocabulary", sectionPageSize],
    initialPageParam: { cursor: null } as CursorPageParam,
    queryFn: ({ pageParam }) =>
      getProfileHistoryPage({
        sectionPageSize,
        vocabularyCursor: pageParam.cursor,
      }),
    getNextPageParam: (lastPage) => ({
      cursor: lastPage.next.vocabularyCursor,
    }),
    select: (data) => ({
      ...data,
      pages: data.pages.map((page) => ({
        items: page.vocabulary,
        nextCursor: page.next.vocabularyCursor,
      })),
    }),
  });
}
