import { z } from "zod";

import { openRouterConfig } from "@/lib/openrouter/config";

export const extractionRequestSchema = z.object({
  passage: z
    .string()
    .trim()
    .min(1, "Passage is required")
    .max(
      openRouterConfig.maxPassageLength,
      `Passage must be at most ${openRouterConfig.maxPassageLength} characters`,
    ),
});

export const vocabularyItemSchema = z.object({
  word: z.string().trim().min(1),
  definition: z.string().trim().min(1),
  context: z.string().trim().min(1),
});

export const extractionResultSchema = z.object({
  vocabulary: z.array(vocabularyItemSchema),
});

export type ExtractionRequest = z.infer<typeof extractionRequestSchema>;
export type VocabularyItem = z.infer<typeof vocabularyItemSchema>;
export type ExtractionResult = z.infer<typeof extractionResultSchema>;

export function parseExtractionRequest(payload: unknown): ExtractionRequest {
  return extractionRequestSchema.parse(payload);
}

export function parseExtractionResult(payload: unknown): ExtractionResult {
  return extractionResultSchema.parse(payload);
}
