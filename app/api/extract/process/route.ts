import { apiError, apiOk } from "@/lib/api/http";
import { getAuthenticatedUserFromAuthorizationHeader } from "@/lib/auth/session";
import {
  claimPendingPassage,
  completeClaimedPassage,
  failClaimedPassage,
  getPassageDetailByRecordId,
  upsertVocabularyItems,
} from "@/lib/firebase/firestore-service";
import {
  extractVocabularyFromPassage,
  OpenRouterClientError,
} from "@/lib/openrouter/client";

function sanitizeExtractionError(error: unknown) {
  if (error instanceof OpenRouterClientError) {
    if (error.code === "OPENROUTER_RATE_LIMITED") {
      return "Extraction provider is currently busy. Please retry shortly.";
    }

    if (error.code === "OPENROUTER_MISSING_API_KEY") {
      return "Extraction service is not configured. Please try again later.";
    }

    if (error.code === "OPENROUTER_INVALID_RESPONSE") {
      return "Extraction provider returned an invalid result. Please retry.";
    }
  }

  return "Extraction provider is currently unavailable. Please retry.";
}

export async function POST(request: Request) {
  const authenticatedUser = await getAuthenticatedUserFromAuthorizationHeader();

  if (!authenticatedUser) {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    const body = await request.json();
    const recordId = typeof body.recordId === "string" ? body.recordId.trim() : "";

    if (!recordId) {
      return apiError("INVALID_INPUT", "recordId is required", 400);
    }

    const claim = await claimPendingPassage({
      uid: authenticatedUser.uid,
      recordId,
    });

    if (!claim) {
      const existingPassage = await getPassageDetailByRecordId({
        uid: authenticatedUser.uid,
        recordId,
      });

      if (!existingPassage) {
        return apiError("NOT_FOUND", "Passage record was not found", 404);
      }

      return apiOk({
        recordId,
        status: existingPassage.status,
        dispatched: false,
      });
    }

    try {
      const vocabulary = await extractVocabularyFromPassage(claim.passage);
      const finalized = await completeClaimedPassage({
        uid: authenticatedUser.uid,
        recordId,
        attemptId: claim.attemptId,
        vocabulary,
      });

      if (finalized && vocabulary.length > 0) {
        await upsertVocabularyItems({
          uid: authenticatedUser.uid,
          extractionId: recordId,
          vocabulary,
        });
      }

      return apiOk({
        recordId,
        status: finalized ? "completed" : "stale",
        dispatched: true,
      });
    } catch (error) {
      await failClaimedPassage({
        uid: authenticatedUser.uid,
        recordId,
        attemptId: claim.attemptId,
        errorReason: sanitizeExtractionError(error),
      });

      return apiOk({
        recordId,
        status: "error" as const,
        dispatched: true,
      });
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return apiError("INVALID_INPUT", "Invalid request body", 400);
    }

    console.error("Unable to process vocabulary extraction:", error);
    return apiError("INTERNAL_ERROR", "Unable to process extraction", 500);
  }
}
