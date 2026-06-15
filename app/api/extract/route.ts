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

  let passage: string;

  try {
    passage = parseExtractionRequest(payload).passage;
  } catch {
    return apiError("INVALID_INPUT", "A valid passage is required", 400);
  }

  const extractionId = crypto.randomUUID();
  const createdAt = Timestamp.now();

  try {
    // const vocabulary = [
    //   {
    //     word: "activated",
    //     definition: "made active or operational",
    //     context:
    //       "When a memory of a past experience is not activated for days or months, forgetting tends to occur.",
    //   },
    //   {
    //     word: "erroneous",
    //     definition: "wrong; incorrect",
    //     context:
    //       "Yet it is erroneous to think that memories simply fade over time—the steps involved are far more complex.",
    //   },
    //   {
    //     word: "fade",
    //     definition: "gradually disappear or lose brightness",
    //     context:
    //       "Yet it is erroneous to think that memories simply fade over time—the steps involved are far more complex.",
    //   },
    //   {
    //     word: "complex",
    //     definition:
    //       "consisting of many different and connected parts; intricate",
    //     context:
    //       "Yet it is erroneous to think that memories simply fade over time—the steps involved are far more complex.",
    //   },
    //   {
    //     word: "auxiliary",
    //     definition: "providing supplementary or additional help",
    //     context:
    //       "In seeking to understand forgetting in the context of memory, such auxiliary phenomena as differences in the rates of forgetting for different kinds of information also must be taken into account.",
    //   },
    //   {
    //     word: "phenomena",
    //     definition: "observable events or facts (plural of phenomenon)",
    //     context:
    //       "In seeking to understand forgetting in the context of memory, such auxiliary phenomena as differences in the rates of forgetting for different kinds of information also must be taken into account.",
    //   },
    //   {
    //     word: "rates",
    //     definition: "measures of speed, frequency, or quantity",
    //     context:
    //       "In seeking to understand forgetting in the context of memory, such auxiliary phenomena as differences in the rates of forgetting for different kinds of information also must be taken into account.",
    //   },
    //   {
    //     word: "context",
    //     definition: "the circumstances or setting surrounding an event or idea",
    //     context:
    //       "In seeking to understand forgetting in the context of memory, such auxiliary phenomena as differences in the rates of forgetting for different kinds of information also must be taken into account.",
    //   },
    //   {
    //     word: "occur",
    //     definition: "happen; take place",
    //     context:
    //       "When a memory of a past experience is not activated for days or months, forgetting tends to occur.",
    //   },
    //   {
    //     word: "taken into account",
    //     definition: "considered when making a judgment or decision",
    //     context:
    //       "In seeking to understand forgetting in the context of memory, such auxiliary phenomena as differences in the rates of forgetting for different kinds of information also must be taken into account.",
    //   },
    // ];
    const vocabulary = await extractVocabularyFromPassage(passage);
    // console.log("🚀 ~ POST ~ vocabulary:", vocabulary);

    await recordPassageHistory({
      uid: authenticatedUser.uid,
      extractionId,
      passageText: passage,
      vocabularyCount: vocabulary.length,
      createdAt,
    });

    if (vocabulary.length > 0) {
      await upsertVocabularyItems({
        uid: authenticatedUser.uid,
        extractionId,
        vocabulary,
        createdAt,
      });
    }

    return apiOk({
      extractionId,
      vocabulary,
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
