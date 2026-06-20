import { z } from "zod";

import { apiError, apiOk } from "@/lib/api/http";
import { getAuthenticatedUserFromAuthorizationHeader } from "@/lib/auth/session";
import { generateVocabularyDraft } from "@/lib/word-actions/draft";

const selectedWordActionSchema = z.object({
  recordId: z.string().trim().min(1),
  passage: z.string().trim().min(1),
  selectedWord: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const authenticatedUser = await getAuthenticatedUserFromAuthorizationHeader();

  if (!authenticatedUser) {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    const body = await request.json();
    const input = selectedWordActionSchema.parse(body);

    const draft = await generateVocabularyDraft(input);

    return apiOk({ draft });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return apiError("INVALID_INPUT", "Invalid request body", 400);
    }

    if (error instanceof z.ZodError) {
      return apiError("INVALID_INPUT", "Invalid selected word data", 400);
    }

    if (
      error instanceof Error &&
      error.message === "OPENROUTER_MISSING_API_KEY"
    ) {
      return apiError(
        "INTERNAL_ERROR",
        "OpenRouter API key is not configured",
        500,
      );
    }

    if (
      error instanceof Error &&
      error.message === "OPENROUTER_PROVIDER_ERROR"
    ) {
      return apiError(
        "INTERNAL_ERROR",
        "Unable to generate vocabulary draft",
        502,
      );
    }

    if (
      error instanceof Error &&
      error.message === "OPENROUTER_INVALID_RESPONSE"
    ) {
      return apiError(
        "INTERNAL_ERROR",
        "Draft generation returned invalid data",
        500,
      );
    }

    return apiError(
      "INTERNAL_ERROR",
      "Unable to generate vocabulary draft",
      500,
    );
  }
}
