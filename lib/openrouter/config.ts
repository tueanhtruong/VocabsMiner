const defaultModel = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
const freeModel =
  process.env.OPENROUTER_MODEL_FREE ?? "openai/gpt-oss-120b:free";

export const openRouterConfig = {
  apiBaseUrl: "https://openrouter.ai/api/v1",
  model: defaultModel,
  requestTimeoutMs: 600_000,
  maxRetryCount: 2,
  maxPassageLength: 10_000,
  freeModel,
} as const;

export function getOpenRouterApiKey() {
  return process.env.OPENROUTER_API_KEY;
}
