import { apiError, apiOk } from "@/lib/api/http";
import { getAuthenticatedUserFromAuthorizationHeader } from "@/lib/auth/session";
import { getProfileHistory } from "@/lib/firebase/firestore-service";

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

  try {
    const history = await getProfileHistory({
      uid: authenticatedUser.uid,
      passagesLimit: parseLimit(url.searchParams.get("passagesLimit")),
      vocabularyLimit: parseLimit(url.searchParams.get("vocabularyLimit")),
      passagesCursor: url.searchParams.get("passagesCursor"),
      vocabularyCursor: url.searchParams.get("vocabularyCursor"),
    });

    return apiOk(history);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_CURSOR") {
      return apiError("INVALID_CURSOR", "Invalid cursor", 400);
    }

    if (error instanceof Error && error.message === "INVALID_INPUT") {
      return apiError("INVALID_INPUT", "Invalid history query parameters", 400);
    }

    return apiError(
      "PROFILE_HISTORY_FAILURE",
      "Unable to load profile history",
      500,
    );
  }
}
