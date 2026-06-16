import { apiError, apiOk } from "@/lib/api/http";
import { getAuthenticatedUserFromAuthorizationHeader } from "@/lib/auth/session";
import {
  getPassageDetailByRecordId,
  listVocabularyCollection,
} from "@/lib/firebase/firestore-service";

function parseLimit(value: string | null) {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed)) {
    throw new Error("INVALID_INPUT");
  }

  return parsed;
}

export async function GET(request: Request) {
  const authenticatedUser = await getAuthenticatedUserFromAuthorizationHeader();

  if (!authenticatedUser) {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }

  const url = new URL(request.url);
  const recordId = url.searchParams.get("recordId")?.trim();

  try {
    if (recordId !== undefined && recordId !== null) {
      if (!recordId) {
        return apiError("INVALID_INPUT", "recordId is required", 400);
      }

      const detail = await getPassageDetailByRecordId({
        uid: authenticatedUser.uid,
        recordId,
      });

      if (!detail) {
        return apiError("NOT_FOUND", "Passage record was not found", 404);
      }

      return apiOk(detail);
    }

    const result = await listVocabularyCollection({
      uid: authenticatedUser.uid,
      limit: parseLimit(url.searchParams.get("limit")),
      cursor: url.searchParams.get("cursor"),
      q: url.searchParams.get("q"),
    });

    return apiOk(result);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_CURSOR") {
      return apiError("INVALID_CURSOR", "Invalid cursor", 400);
    }

    if (error instanceof Error && error.message === "INVALID_INPUT") {
      return apiError(
        "INVALID_INPUT",
        "Invalid vocabulary query parameters",
        400,
      );
    }

    if (recordId) {
      return apiError("NOT_FOUND", "Unable to load passage detail", 500);
    }

    return apiError("INTERNAL_ERROR", "Unable to load vocabulary", 500);
  }
}
