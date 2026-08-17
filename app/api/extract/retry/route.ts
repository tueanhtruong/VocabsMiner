import { apiError, apiOk } from "@/lib/api/http";
import { dispatchPassageExtraction } from "@/lib/api/extraction-dispatch";
import { getAuthenticatedUserFromAuthorizationHeader } from "@/lib/auth/session";
import { retryPassageExtraction } from "@/lib/firebase/firestore-service";

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

    const result = await retryPassageExtraction({
      uid: authenticatedUser.uid,
      recordId,
    });

    dispatchPassageExtraction({
      requestUrl: request.url,
      recordId,
      idToken: authenticatedUser.idToken,
    });

    return apiOk(result);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return apiError("NOT_FOUND", "Passage record was not found", 404);
    }

    if (error instanceof Error && error.message === "INVALID_INPUT") {
      return apiError(
        "INVALID_INPUT",
        "Only failed extractions can be retried",
        400,
      );
    }

    if (error instanceof SyntaxError) {
      return apiError("INVALID_INPUT", "Invalid request body", 400);
    }

    return apiError("INTERNAL_ERROR", "Unable to retry extraction", 500);
  }
}
