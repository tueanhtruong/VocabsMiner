import { getUidFromLocalStore } from "../auth/google-auth";

export type ApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
  };
};

export class ApiClientError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
  }
}

export async function requestJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getUidFromLocalStore() ?? ""}`,
      ...(init?.headers ?? {}),
    },
  });

  const responseJson = (await response.json().catch(() => null)) as
    | T
    | ApiErrorPayload
    | null;

  if (!response.ok) {
    const payload = responseJson as ApiErrorPayload | null;

    throw new ApiClientError(
      payload?.error?.code ?? "INTERNAL_ERROR",
      payload?.error?.message ?? "Request failed",
    );
  }

  return responseJson as T;
}
