import { apiError, apiOk } from "@/lib/api/http";
import { getAuthenticatedUserFromAuthorizationHeader } from "@/lib/auth/session";
import {
  addVocabularyToPassage,
  deleteVocabularyFromPassage,
  getPassageDetailByRecordId,
  listVocabularyCollection,
  updateVocabularyInPassage,
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

function parseIndex(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error("INVALID_INPUT");
  }

  return value;
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

export async function POST(request: Request) {
  const authenticatedUser = await getAuthenticatedUserFromAuthorizationHeader();

  if (!authenticatedUser) {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    const body = await request.json();

    const recordId = body.recordId?.trim();
    const word = body.word?.trim();
    const definition = body.definition?.trim();
    const type = body.type?.trim() || "";
    const phonetic = body.phonetic?.trim() || "";
    const context = body.context?.trim() || "";

    if (!recordId) {
      return apiError("INVALID_INPUT", "recordId is required", 400);
    }

    if (!word) {
      return apiError("INVALID_INPUT", "word is required", 400);
    }

    if (!definition) {
      return apiError("INVALID_INPUT", "definition is required", 400);
    }

    const vocabulary = await addVocabularyToPassage({
      uid: authenticatedUser.uid,
      recordId,
      vocabulary: {
        word,
        type,
        phonetic,
        definition,
        context,
      },
    });

    return apiOk({
      recordId,
      vocabulary,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return apiError("NOT_FOUND", "Passage record was not found", 404);
    }

    if (error instanceof Error && error.message === "INVALID_INPUT") {
      return apiError("INVALID_INPUT", "Invalid vocabulary data", 400);
    }

    if (error instanceof SyntaxError) {
      return apiError("INVALID_INPUT", "Invalid request body", 400);
    }

    return apiError("INTERNAL_ERROR", "Unable to add vocabulary", 500);
  }
}

export async function PUT(request: Request) {
  const authenticatedUser = await getAuthenticatedUserFromAuthorizationHeader();

  if (!authenticatedUser) {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    const body = await request.json();

    const recordId = body.recordId?.trim();
    const index = parseIndex(body.index);
    const word = body.word?.trim();
    const definition = body.definition?.trim();
    const type = body.type?.trim() || "";
    const phonetic = body.phonetic?.trim() || "";
    const context = body.context?.trim() || "";

    if (!recordId) {
      return apiError("INVALID_INPUT", "recordId is required", 400);
    }

    if (!word) {
      return apiError("INVALID_INPUT", "word is required", 400);
    }

    if (!definition) {
      return apiError("INVALID_INPUT", "definition is required", 400);
    }

    const vocabulary = await updateVocabularyInPassage({
      uid: authenticatedUser.uid,
      recordId,
      index,
      vocabulary: {
        word,
        type,
        phonetic,
        definition,
        context,
      },
    });

    return apiOk({
      recordId,
      index,
      vocabulary,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "NOT_FOUND" || error.message === "ITEM_NOT_FOUND")
    ) {
      return apiError("NOT_FOUND", "Vocabulary item was not found", 404);
    }

    if (error instanceof Error && error.message === "INVALID_INPUT") {
      return apiError("INVALID_INPUT", "Invalid vocabulary data", 400);
    }

    if (error instanceof SyntaxError) {
      return apiError("INVALID_INPUT", "Invalid request body", 400);
    }

    return apiError("INTERNAL_ERROR", "Unable to update vocabulary", 500);
  }
}

export async function DELETE(request: Request) {
  const authenticatedUser = await getAuthenticatedUserFromAuthorizationHeader();

  if (!authenticatedUser) {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    const body = await request.json();

    const recordId = body.recordId?.trim();
    const index = parseIndex(body.index);

    if (!recordId) {
      return apiError("INVALID_INPUT", "recordId is required", 400);
    }

    const deletedVocabulary = await deleteVocabularyFromPassage({
      uid: authenticatedUser.uid,
      recordId,
      index,
    });

    return apiOk({
      recordId,
      index,
      deletedVocabulary,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "NOT_FOUND" || error.message === "ITEM_NOT_FOUND")
    ) {
      return apiError("NOT_FOUND", "Vocabulary item was not found", 404);
    }

    if (error instanceof Error && error.message === "INVALID_INPUT") {
      return apiError("INVALID_INPUT", "Invalid vocabulary data", 400);
    }

    if (error instanceof SyntaxError) {
      return apiError("INVALID_INPUT", "Invalid request body", 400);
    }

    return apiError("INTERNAL_ERROR", "Unable to delete vocabulary", 500);
  }
}
