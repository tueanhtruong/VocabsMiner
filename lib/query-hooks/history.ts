"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
  type: string;
  phonetic: string;
  vietnamese: string;
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

type DeletePassageHistoryResponse = {
  recordId: string;
  deleted: boolean;
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

async function deletePassageHistory(recordId: string) {
  return requestJson<DeletePassageHistoryResponse>("/api/profile/history", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ recordId }),
  });
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

export function useDeletePassageHistoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePassageHistory,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["history", "passages"] }),
        queryClient.invalidateQueries({ queryKey: ["history", "vocabulary"] }),
      ]);
    },
  });
}
