import { NextResponse } from "next/server";

type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "INVALID_INPUT"
  | "INVALID_CURSOR"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "EXTRACTION_PROVIDER_ERROR"
  | "STORAGE_FAILURE"
  | "PROFILE_HISTORY_FAILURE"
  | "INTERNAL_ERROR";

export function apiOk<T>(payload: T, init?: ResponseInit) {
  return NextResponse.json(payload, init);
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  init?: ResponseInit,
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    {
      status,
      ...init,
    },
  );
}
