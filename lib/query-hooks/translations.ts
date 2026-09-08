"use client";

import { requestJson } from "@/lib/query-hooks/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type ParagraphTranslationState =
  | "missing"
  | "available"
  | "generating"
  | "error";

export type PassageParagraph = {
  paragraphId: string;
  index: number;
  sourceText: string;
  translation?: string;
  translationState: ParagraphTranslationState;
  translationError?: string;
  translationUpdatedAt?: string;
};

export type TranslationMutationMode = "manual" | "ai";

export type SaveParagraphTranslationRequest = {
  recordId: string;
  paragraphId: string;
  mode: TranslationMutationMode;
  translation?: string;
};

export type DeleteParagraphTranslationRequest = {
  recordId: string;
  paragraphId: string;
};

export type ParagraphTranslationResponse = {
  recordId: string;
  paragraph: PassageParagraph;
};

export async function saveParagraphTranslation(
  payload: SaveParagraphTranslationRequest,
  method: "POST" | "PUT" = "POST",
) {
  return requestJson<ParagraphTranslationResponse>("/api/translations", {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteParagraphTranslation(
  payload: DeleteParagraphTranslationRequest,
) {
  return requestJson<ParagraphTranslationResponse>("/api/translations", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

function useInvalidatePassageDetail(recordId: string) {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({
      queryKey: ["passage-detail", recordId],
    });
  };
}

export function useAddParagraphTranslationMutation(recordId: string) {
  const invalidatePassageDetail = useInvalidatePassageDetail(recordId);

  return useMutation({
    mutationFn: (payload: Omit<SaveParagraphTranslationRequest, "recordId">) =>
      saveParagraphTranslation({ ...payload, recordId }, "POST"),
    onSuccess: invalidatePassageDetail,
  });
}

export function useEditParagraphTranslationMutation(recordId: string) {
  const invalidatePassageDetail = useInvalidatePassageDetail(recordId);

  return useMutation({
    mutationFn: (payload: Omit<SaveParagraphTranslationRequest, "recordId">) =>
      saveParagraphTranslation({ ...payload, recordId }, "PUT"),
    onSuccess: invalidatePassageDetail,
  });
}

export function useDeleteParagraphTranslationMutation(recordId: string) {
  const invalidatePassageDetail = useInvalidatePassageDetail(recordId);

  return useMutation({
    mutationFn: (
      payload: Omit<DeleteParagraphTranslationRequest, "recordId">,
    ) => deleteParagraphTranslation({ ...payload, recordId }),
    onSuccess: invalidatePassageDetail,
  });
}

export function useGenerateParagraphTranslationMutation(recordId: string) {
  const invalidatePassageDetail = useInvalidatePassageDetail(recordId);

  return useMutation({
    mutationFn: (paragraphId: string) =>
      saveParagraphTranslation({ recordId, paragraphId, mode: "ai" }, "POST"),
    onSuccess: invalidatePassageDetail,
  });
}

export function useRegenerateParagraphTranslationMutation(recordId: string) {
  const invalidatePassageDetail = useInvalidatePassageDetail(recordId);

  return useMutation({
    mutationFn: (paragraphId: string) =>
      saveParagraphTranslation({ recordId, paragraphId, mode: "ai" }, "PUT"),
    onSuccess: invalidatePassageDetail,
  });
}
