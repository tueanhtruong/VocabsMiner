import { Timestamp } from "firebase-admin/firestore";

import { apiError, apiOk } from "@/lib/api/http";
import { getAuthenticatedUserFromAuthorizationHeader } from "@/lib/auth/session";
import {
  recordPassageHistory,
  upsertVocabularyItems,
} from "@/lib/firebase/firestore-service";
import {
  OpenRouterClientError,
  extractVocabularyFromPassage,
} from "@/lib/openrouter/client";
import { parseExtractionRequest } from "@/lib/openrouter/extraction-schema";

function mapOpenRouterError(error: OpenRouterClientError) {
  if (error.code === "OPENROUTER_RATE_LIMITED") {
    return apiError(
      "RATE_LIMITED",
      "Extraction provider is currently busy",
      429,
    );
  }

  if (error.code === "OPENROUTER_MISSING_API_KEY") {
    return apiError(
      "EXTRACTION_PROVIDER_ERROR",
      "Extraction service is not configured",
      502,
    );
  }

  return apiError(
    "EXTRACTION_PROVIDER_ERROR",
    "Extraction provider failed",
    502,
  );
}

export async function POST(request: Request) {
  const authenticatedUser = await getAuthenticatedUserFromAuthorizationHeader();

  if (!authenticatedUser) {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }

  const payload = await request.json().catch(() => null);

  let title: string;
  let passage: string;

  try {
    const parsedPayload = parseExtractionRequest(payload);
    title = parsedPayload.title;
    passage = parsedPayload.passage;
  } catch {
    return apiError(
      "INVALID_INPUT",
      "A valid title and passage are required",
      400,
    );
  }

  const recordId = crypto.randomUUID();
  const createdAt = Timestamp.now();

  try {
    const vocabulary = await extractVocabularyFromPassage(passage);

    await recordPassageHistory({
      uid: authenticatedUser.uid,
      extractionId: recordId,
      title,
      passageText: passage,
      vocabulary,
      vocabularyCount: vocabulary.length,
      createdAt,
    });

    if (vocabulary.length > 0) {
      await upsertVocabularyItems({
        uid: authenticatedUser.uid,
        extractionId: recordId,
        vocabulary,
        createdAt,
      });
    }

    return apiOk({
      recordId,
      title,
      passage,
      vocabularyList: vocabulary,
      resultCount: vocabulary.length,
      saved: true,
      createdAt: createdAt.toDate().toISOString(),
    });
  } catch (error) {
    console.error("Extraction error:", error);
    if (error instanceof OpenRouterClientError) {
      return mapOpenRouterError(error);
    }

    return apiError(
      "STORAGE_FAILURE",
      "Unable to save extraction history",
      500,
    );
  }
}
