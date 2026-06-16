import "server-only";

import { z } from "zod";

import {
  parseExtractionResult,
  VocabularyItem,
} from "@/lib/openrouter/extraction-schema";
import { getOpenRouterApiKey, openRouterConfig } from "@/lib/openrouter/config";

const openRouterResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.unknown().nullable().optional(),
        }),
      }),
    )
    .min(1),
});

type OpenRouterErrorCode =
  | "OPENROUTER_MISSING_API_KEY"
  | "OPENROUTER_RATE_LIMITED"
  | "OPENROUTER_PROVIDER_ERROR"
  | "OPENROUTER_INVALID_RESPONSE";

export class OpenRouterClientError extends Error {
  code: OpenRouterErrorCode;

  constructor(code: OpenRouterErrorCode, message: string) {
    super(message);
    this.name = "OpenRouterClientError";
    this.code = code;
  }
}

function withTimeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeout),
  };
}

function cleanJsonContent(rawContent: string) {
  const trimmed = rawContent.trim();

  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  return trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 429 || status >= 500;
}

function toOpenRouterError(status: number, bodyText: string) {
  if (status === 429) {
    return new OpenRouterClientError(
      "OPENROUTER_RATE_LIMITED",
      "Extraction provider is currently rate limited",
    );
  }

  return new OpenRouterClientError(
    "OPENROUTER_PROVIDER_ERROR",
    `OpenRouter request failed (${status}): ${bodyText.slice(0, 300)}`,
  );
}

function buildExtractionPrompt(passage: string) {
  return `Extract all academic vocabulary at IELTS Band 5+ level from the passage below.
Rules:
- Include only words/phrases that are academic, formal, or topic-specific (exclude basic everyday words)
- Prefer words useful for IELTS Writing/Reading
- Return STRICT JSON only - no explanation, no markdown, no extra text
Output shape:
{"vocabulary":[{"word":"","type":"","phonetic":"","definition":"","context":""}]}
- "word": the word or phrase as it appears
- "type": part of speech — one of: noun | verb | adjective | adverb | phrase | conjunction | preposition
- "phonetic": the IPA phonetic transcription
- "definition": a concise English definition
- "context": the exact sentence it was used in
Passage:
"""
${passage}
"""`;
}

async function requestOpenRouter(passage: string) {
  const apiKey = getOpenRouterApiKey();

  if (!apiKey) {
    throw new OpenRouterClientError(
      "OPENROUTER_MISSING_API_KEY",
      "OPENROUTER_API_KEY is not configured",
    );
  }

  const payload = {
    model: openRouterConfig.model,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a JSON-only response API. Never include markdown or explanation.",
      },
      {
        role: "user",
        content: buildExtractionPrompt(passage),
      },
    ],
    temperature: 0.1,
  };

  const timeoutHandle = withTimeoutSignal(openRouterConfig.requestTimeoutMs);

  try {
    return await fetch(`${openRouterConfig.apiBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: timeoutHandle.signal,
      cache: "no-store",
    });
  } finally {
    timeoutHandle.clear();
  }
}

function parseContentToVocabulary(content: string): VocabularyItem[] {
  let parsedContent: unknown;

  try {
    parsedContent = JSON.parse(cleanJsonContent(content));
  } catch {
    throw new OpenRouterClientError(
      "OPENROUTER_INVALID_RESPONSE",
      "OpenRouter returned invalid JSON",
    );
  }

  const parsed = parseExtractionResult(parsedContent);

  return parsed.vocabulary;
}

function parseVocabularyFromUnknownContent(content: unknown): VocabularyItem[] {
  if (!content) {
    throw new OpenRouterClientError(
      "OPENROUTER_INVALID_RESPONSE",
      "OpenRouter response did not include completion content",
    );
  }

  if (typeof content === "string") {
    return parseContentToVocabulary(content);
  }

  if (Array.isArray(content)) {
    const combinedText = content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }

        if (
          part &&
          typeof part === "object" &&
          "text" in part &&
          typeof part.text === "string"
        ) {
          return part.text;
        }

        return "";
      })
      .join("\n")
      .trim();

    if (!combinedText) {
      throw new OpenRouterClientError(
        "OPENROUTER_INVALID_RESPONSE",
        "OpenRouter response content parts were empty",
      );
    }

    return parseContentToVocabulary(combinedText);
  }

  if (typeof content === "object") {
    if (
      "vocabulary" in content &&
      Array.isArray((content as { vocabulary?: unknown }).vocabulary)
    ) {
      return parseExtractionResult(content).vocabulary;
    }

    if (
      "text" in content &&
      typeof (content as { text?: unknown }).text === "string"
    ) {
      return parseContentToVocabulary((content as { text: string }).text);
    }
  }

  throw new OpenRouterClientError(
    "OPENROUTER_INVALID_RESPONSE",
    "OpenRouter completion content format is unsupported",
  );
}

export async function extractVocabularyFromPassage(passage: string) {
  let latestError: OpenRouterClientError | null = null;

  for (
    let attempt = 0;
    attempt <= openRouterConfig.maxRetryCount;
    attempt += 1
  ) {
    try {
      const response = await requestOpenRouter(passage);
      const rawResponseText = await response.text();

      if (!response.ok) {
        const bodyText = await response.text().catch(() => "");
        const providerError = toOpenRouterError(response.status, bodyText);

        if (
          attempt < openRouterConfig.maxRetryCount &&
          isRetryableStatus(response.status)
        ) {
          latestError = providerError;
          continue;
        }

        throw providerError;
      }

      let parsedResponseJson: unknown;

      try {
        parsedResponseJson = JSON.parse(rawResponseText);
      } catch {
        throw new OpenRouterClientError(
          "OPENROUTER_INVALID_RESPONSE",
          "OpenRouter returned invalid JSON payload",
        );
      }

      const responseJson = openRouterResponseSchema.parse(parsedResponseJson);

      const rawContent = responseJson.choices[0]?.message.content;

      return parseVocabularyFromUnknownContent(rawContent);
    } catch (error) {
      if (error instanceof OpenRouterClientError) {
        if (
          error.code === "OPENROUTER_RATE_LIMITED" &&
          attempt < openRouterConfig.maxRetryCount
        ) {
          latestError = error;
          continue;
        }

        throw error;
      }

      if (attempt < openRouterConfig.maxRetryCount) {
        latestError = new OpenRouterClientError(
          "OPENROUTER_PROVIDER_ERROR",
          "Transient extraction failure, retrying",
        );
        continue;
      }

      throw (
        latestError ??
        new OpenRouterClientError(
          "OPENROUTER_PROVIDER_ERROR",
          "Unable to complete extraction request",
        )
      );
    }
  }

  throw (
    latestError ??
    new OpenRouterClientError(
      "OPENROUTER_PROVIDER_ERROR",
      "Unable to complete extraction request",
    )
  );
}
