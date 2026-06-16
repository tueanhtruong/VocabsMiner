type ExtractionErrorCode =
  | "INVALID_INPUT"
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "EXTRACTION_PROVIDER_ERROR"
  | "STORAGE_FAILURE"
  | "PROFILE_HISTORY_FAILURE"
  | "DETAIL_LOAD_FAILURE"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

type ExtractionStatusProps = {
  errorCode: string | null;
  fallbackMessage?: string;
};

const messages: Record<ExtractionErrorCode, string> = {
  INVALID_INPUT:
    "Please enter both a title and a non-empty passage before extracting.",
  UNAUTHORIZED: "Your session expired. Please sign in again.",
  RATE_LIMITED:
    "The extraction service is busy right now. Please retry shortly.",
  EXTRACTION_PROVIDER_ERROR:
    "The vocabulary service could not process this passage right now. Please try again in a moment.",
  STORAGE_FAILURE:
    "We extracted vocabulary but could not save this passage, so the detail page could not open. Please submit again.",
  PROFILE_HISTORY_FAILURE:
    "Your passage history could not be loaded right now. Refresh and try again.",
  DETAIL_LOAD_FAILURE:
    "This passage detail is temporarily unavailable. Return to dashboard and try opening it again.",
  NOT_FOUND:
    "That passage record no longer exists. Return to dashboard and choose another saved passage.",
  INTERNAL_ERROR: "Something unexpected happened. Please retry.",
};

export function ExtractionStatus({
  errorCode,
  fallbackMessage,
}: ExtractionStatusProps) {
  if (!errorCode) {
    return null;
  }

  const message =
    messages[errorCode as ExtractionErrorCode] ??
    fallbackMessage ??
    "Unexpected extraction error";

  return (
    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </p>
  );
}
