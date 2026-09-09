import { z } from "zod";

import { apiError, apiOk } from "@/lib/api/http";
import { getAuthenticatedUserFromAuthorizationHeader } from "@/lib/auth/session";
import { translateSelectedWordToVietnamese } from "@/lib/word-actions/translate";

const selectedWordSchema = z.object({
  selectedWord: z.string().trim().min(1).max(100),
});

export async function POST(request: Request) {
  const authenticatedUser = await getAuthenticatedUserFromAuthorizationHeader();

  if (!authenticatedUser) {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    const input = selectedWordSchema.parse(await request.json());
    const result = await translateSelectedWordToVietnamese({
      recordId: "",
      passage: "",
      selectedWord: input.selectedWord,
    });

    return apiOk({ vietnamese: result.vietnamese });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return apiError("INVALID_INPUT", "Invalid request body", 400);
    }

    if (error instanceof z.ZodError) {
      return apiError(
        "INVALID_INPUT",
        "A valid selected word is required",
        400,
      );
    }

    if (error instanceof Error && error.message === "TRANSLATION_EMPTY") {
      return apiError(
        "TRANSLATION_PROVIDER_ERROR",
        "Translation provider returned no text",
        502,
      );
    }

    console.error("Unable to translate selected word:", error);
    return apiError(
      "TRANSLATION_PROVIDER_ERROR",
      "Translation provider is currently unavailable. Please retry.",
      502,
    );
  }
}
