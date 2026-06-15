"use client";

import { useMutation } from "@tanstack/react-query";

import { requestJson } from "@/lib/query-hooks/api-client";

export type ExtractionVocabularyItem = {
  word: string;
  definition: string;
  context: string;
};

export type ExtractionResponse = {
  extractionId: string;
  vocabulary: ExtractionVocabularyItem[];
  resultCount: number;
  saved: boolean;
  createdAt: string;
};

export function useExtractVocabularyMutation() {
  return useMutation({
    mutationFn: async (passage: string) =>
      requestJson<ExtractionResponse>("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ passage }),
      }),
  });
}
