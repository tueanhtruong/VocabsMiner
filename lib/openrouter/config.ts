const defaultModel = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";

export const openRouterConfig = {
  apiBaseUrl: "https://openrouter.ai/api/v1",
  model: defaultModel,
  requestTimeoutMs: 600_000,
  maxRetryCount: 2,
  maxPassageLength: 5_000,
} as const;

export function getOpenRouterApiKey() {
  return process.env.OPENROUTER_API_KEY;
}
