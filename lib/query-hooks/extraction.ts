"use client";

import { useMutation } from "@tanstack/react-query";

import { requestJson } from "@/lib/query-hooks/api-client";

export type ExtractionVocabularyItem = {
  word: string;
  definition: string;
  context: string;
};

export type ExtractVocabularyRequest = {
  title: string;
  passage: string;
};

export type ExtractionResponse = {
  recordId: string;
  title: string;
  passage: string;
  vocabularyList: ExtractionVocabularyItem[];
  resultCount: number;
  saved: boolean;
  createdAt: string;
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
