type ExtractionErrorCode =
  | "INVALID_INPUT"
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "EXTRACTION_PROVIDER_ERROR"
  | "STORAGE_FAILURE"
  | "INTERNAL_ERROR";

type ExtractionStatusProps = {
  errorCode: string | null;
  fallbackMessage?: string;
};

const messages: Record<ExtractionErrorCode, string> = {
  INVALID_INPUT: "Please enter a non-empty passage before extracting.",
  UNAUTHORIZED: "Your session expired. Please sign in again.",
  RATE_LIMITED:
    "The extraction service is busy right now. Please retry shortly.",
  EXTRACTION_PROVIDER_ERROR:
    "We could not process this passage at the moment. Please try again.",
  STORAGE_FAILURE:
    "Extraction finished, but we could not save your data. Please retry.",
  INTERNAL_ERROR: "Something went wrong. Please try again.",
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
