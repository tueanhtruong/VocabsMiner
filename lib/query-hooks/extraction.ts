"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { requestJson } from "@/lib/query-hooks/api-client";

export type ExtractionVocabularyItem = {
  word: string;
  type: string;
  phonetic: string;
  definition: string;
  vietnamese: string;
};

export type ExtractVocabularyRequest = {
  title: string;
  passage: string;
};

export type ExtractionResponse = {
  recordId: string;
  title: string;
  passage: string;
  status: "pending";
  vocabularyList: ExtractionVocabularyItem[];
  resultCount: number;
  saved: boolean;
  createdAt: string;
};

export type RetryExtractionResponse = {
  recordId: string;
  status: "pending";
};

export function useExtractVocabularyMutation() {
  return useMutation({
    mutationFn: async (payload: ExtractVocabularyRequest) =>
      requestJson<ExtractionResponse>("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }),
  });
}

async function retryExtraction(recordId: string) {
  return requestJson<RetryExtractionResponse>("/api/extract/retry", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ recordId }),
  });
}

export function useRetryExtractionMutation(recordId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => retryExtraction(recordId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["passage-detail", recordId],
        }),
        queryClient.invalidateQueries({ queryKey: ["history", "passages"] }),
      ]);
    },
  });
}
