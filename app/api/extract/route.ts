import { Timestamp } from "firebase-admin/firestore";

import { apiError, apiOk } from "@/lib/api/http";
import { dispatchPassageExtraction } from "@/lib/api/extraction-dispatch";
import { getAuthenticatedUserFromAuthorizationHeader } from "@/lib/auth/session";
import { createPendingPassage } from "@/lib/firebase/firestore-service";
import { parseExtractionRequest } from "@/lib/openrouter/extraction-schema";

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
    const savedPassage = await createPendingPassage({
      uid: authenticatedUser.uid,
      recordId,
      title,
      passageText: passage,
      createdAt,
    });

    dispatchPassageExtraction({
      requestUrl: request.url,
      recordId,
      idToken: authenticatedUser.idToken,
    });

    return apiOk({
      recordId,
      title: savedPassage.title,
      passage: savedPassage.passage,
      status: "pending" as const,
      vocabularyList: [],
      resultCount: 0,
      saved: true,
      createdAt: createdAt.toDate().toISOString(),
    });
  } catch (error) {
    console.error("Extraction error:", error);

    return apiError(
      "STORAGE_FAILURE",
      "Unable to save extraction history",
      500,
    );
  }
}
