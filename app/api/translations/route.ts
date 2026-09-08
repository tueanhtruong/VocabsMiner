import { apiError, apiOk } from "@/lib/api/http";
import { getAuthenticatedUserFromAuthorizationHeader } from "@/lib/auth/session";
import {
  claimParagraphTranslation,
  completeParagraphTranslation,
  deleteParagraphTranslation,
  failParagraphTranslation,
  saveParagraphTranslation,
} from "@/lib/firebase/firestore-service";
import {
  OpenRouterClientError,
  translateParagraphToVietnamese,
} from "@/lib/openrouter/client";

function getStringField(body: Record<string, unknown>, field: string) {
  return typeof body[field] === "string" ? body[field].trim() : "";
}

function getTranslationError(error: unknown) {
  if (!(error instanceof Error)) {
    return null;
  }

  if (error.message === "NOT_FOUND") {
    return apiError("NOT_FOUND", "Passage record was not found", 404);
  }

  if (error.message === "PARAGRAPH_NOT_FOUND") {
    return apiError("INVALID_INPUT", "Paragraph was not found", 400);
  }

  if (error.message === "TRANSLATION_IN_PROGRESS") {
    return apiError(
      "TRANSLATION_IN_PROGRESS",
      "Another translation operation is already in progress",
      409,
    );
  }

  if (error.message === "INVALID_INPUT") {
    return apiError(
      "INVALID_INPUT",
      "A non-empty translation is required",
      400,
    );
  }

  return null;
}

function getProviderErrorMessage(error: unknown) {
  if (error instanceof OpenRouterClientError) {
    if (error.code === "OPENROUTER_RATE_LIMITED") {
      return "Translation provider is currently busy. Please retry shortly.";
    }

    if (error.code === "OPENROUTER_MISSING_API_KEY") {
      return "Translation service is not configured. Please try again later.";
    }

    if (error.code === "OPENROUTER_INVALID_RESPONSE") {
      return "Translation provider returned an invalid result. Please retry.";
    }
  }

  return "Translation provider is currently unavailable. Please retry.";
}

async function generateParagraphTranslation(params: {
  uid: string;
  recordId: string;
  paragraphId: string;
}) {
  const claim = await claimParagraphTranslation(params);

  if (!claim) {
    throw new Error("TRANSLATION_IN_PROGRESS");
  }

  try {
    const translation = await translateParagraphToVietnamese(claim.sourceText);
    const paragraph = await completeParagraphTranslation({
      ...params,
      operationId: claim.operationId,
      translation,
    });

    if (!paragraph) {
      throw new Error("STALE_TRANSLATION_OPERATION");
    }

    return paragraph;
  } catch (error) {
    await failParagraphTranslation({
      ...params,
      operationId: claim.operationId,
      errorReason: getProviderErrorMessage(error),
    });

    throw error;
  }
}

async function getAuthenticatedUser() {
  const authenticatedUser = await getAuthenticatedUserFromAuthorizationHeader();

  if (!authenticatedUser) {
    return null;
  }

  return authenticatedUser;
}

export async function POST(request: Request) {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser) {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const recordId = getStringField(body, "recordId");
    const paragraphId = getStringField(body, "paragraphId");
    const mode = getStringField(body, "mode");

    if (!recordId || !paragraphId || !["manual", "ai"].includes(mode)) {
      return apiError("INVALID_INPUT", "Invalid translation request", 400);
    }

    if (mode === "ai") {
      const paragraph = await generateParagraphTranslation({
        uid: authenticatedUser.uid,
        recordId,
        paragraphId,
      });

      return apiOk({ recordId, paragraph });
    }

    const paragraph = await saveParagraphTranslation({
      uid: authenticatedUser.uid,
      recordId,
      paragraphId,
      translation: getStringField(body, "translation"),
    });

    return apiOk({ recordId, paragraph });
  } catch (error) {
    const response = getTranslationError(error);

    if (response) {
      return response;
    }

    if (error instanceof OpenRouterClientError) {
      return apiError(
        "TRANSLATION_PROVIDER_ERROR",
        getProviderErrorMessage(error),
        502,
      );
    }

    if (
      error instanceof Error &&
      error.message === "STALE_TRANSLATION_OPERATION"
    ) {
      return apiError(
        "TRANSLATION_IN_PROGRESS",
        "Translation operation was superseded. Please retry.",
        409,
      );
    }

    if (error instanceof SyntaxError) {
      return apiError("INVALID_INPUT", "Invalid request body", 400);
    }

    console.error("Unable to add paragraph translation:", error);
    return apiError("INTERNAL_ERROR", "Unable to save translation", 500);
  }
}

export async function PUT(request: Request) {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser) {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const recordId = getStringField(body, "recordId");
    const paragraphId = getStringField(body, "paragraphId");
    const mode = getStringField(body, "mode");

    if (!recordId || !paragraphId || !["manual", "ai"].includes(mode)) {
      return apiError("INVALID_INPUT", "Invalid translation request", 400);
    }

    if (mode === "ai") {
      const paragraph = await generateParagraphTranslation({
        uid: authenticatedUser.uid,
        recordId,
        paragraphId,
      });

      return apiOk({ recordId, paragraph });
    }

    const paragraph = await saveParagraphTranslation({
      uid: authenticatedUser.uid,
      recordId,
      paragraphId,
      translation: getStringField(body, "translation"),
    });

    return apiOk({ recordId, paragraph });
  } catch (error) {
    const response = getTranslationError(error);

    if (response) {
      return response;
    }

    if (error instanceof OpenRouterClientError) {
      return apiError(
        "TRANSLATION_PROVIDER_ERROR",
        getProviderErrorMessage(error),
        502,
      );
    }

    if (
      error instanceof Error &&
      error.message === "STALE_TRANSLATION_OPERATION"
    ) {
      return apiError(
        "TRANSLATION_IN_PROGRESS",
        "Translation operation was superseded. Please retry.",
        409,
      );
    }

    if (error instanceof SyntaxError) {
      return apiError("INVALID_INPUT", "Invalid request body", 400);
    }

    console.error("Unable to edit paragraph translation:", error);
    return apiError("INTERNAL_ERROR", "Unable to save translation", 500);
  }
}

export async function DELETE(request: Request) {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser) {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const recordId = getStringField(body, "recordId");
    const paragraphId = getStringField(body, "paragraphId");

    if (!recordId || !paragraphId) {
      return apiError("INVALID_INPUT", "Invalid translation request", 400);
    }

    const paragraph = await deleteParagraphTranslation({
      uid: authenticatedUser.uid,
      recordId,
      paragraphId,
    });

    return apiOk({ recordId, paragraph });
  } catch (error) {
    const response = getTranslationError(error);

    if (response) {
      return response;
    }

    if (error instanceof SyntaxError) {
      return apiError("INVALID_INPUT", "Invalid request body", 400);
    }

    console.error("Unable to delete paragraph translation:", error);
    return apiError("INTERNAL_ERROR", "Unable to delete translation", 500);
  }
}
