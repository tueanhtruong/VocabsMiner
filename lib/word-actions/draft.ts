import { z } from "zod";

import { openRouterConfig, getOpenRouterApiKey } from "@/lib/openrouter/config";
import type {
  SelectedWordActionInput,
  VocabularyDraft,
} from "@/lib/word-actions/types";

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

const vocabularyDraftContentSchema = z.object({
  draft: z.object({
    word: z.string().trim().min(1),
    type: z.string().trim().min(1),
    phonetic: z.string().trim().min(1),
    definition: z.string().trim().min(1),
    vietnamese: z.string().trim().min(1),
  }),
});

type OpenRouterResponse = z.infer<typeof openRouterResponseSchema>;

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

function buildVocabularyDraftPrompt(input: SelectedWordActionInput) {
  return `Create a vocabulary draft from the selected word and passage context.
Return STRICT JSON only - no markdown, no explanation, no extra text.
Output shape:
{"draft":{"word":"","type":"","phonetic":"","definition":"","vietnamese":""}}
- "word": the selected word exactly as it appears or the best single-word headword
- "type": one of noun | verb | adjective | adverb | phrase | conjunction | preposition
- "phonetic": the IPA transcription
- "definition": a concise learner-friendly English definition
- "vietnamese": a concise Vietnamese translation
Selected word:
"""
${input.selectedWord}
"""`;
}

async function requestOpenRouterDraft(input: SelectedWordActionInput) {
  const apiKey = getOpenRouterApiKey();

  if (!apiKey) {
    throw new Error("OPENROUTER_MISSING_API_KEY");
  }

  const payload = {
    model: openRouterConfig.freeModel,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a JSON-only response API. Never include markdown or explanation.",
      },
      {
        role: "user",
        content: buildVocabularyDraftPrompt(input),
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

function parseDraftContent(content: string): VocabularyDraft {
  let parsedContent: unknown;

  try {
    parsedContent = JSON.parse(cleanJsonContent(content));
  } catch {
    throw new Error("OPENROUTER_INVALID_RESPONSE");
  }

  const parsed = vocabularyDraftContentSchema.parse(parsedContent);

  return {
    recordId: "",
    sourceWord: parsed.draft.word,
    ...parsed.draft,
  };
}

function parseDraftFromUnknownContent(content: unknown) {
  if (!content) {
    throw new Error("OPENROUTER_INVALID_RESPONSE");
  }

  if (typeof content === "string") {
    return parseDraftContent(content);
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
      throw new Error("OPENROUTER_INVALID_RESPONSE");
    }

    return parseDraftContent(combinedText);
  }

  if (typeof content === "object") {
    if (
      "draft" in content &&
      typeof (content as { draft?: unknown }).draft === "object"
    ) {
      const parsed = vocabularyDraftContentSchema.parse(content);

      return {
        recordId: "",
        sourceWord: parsed.draft.word,
        ...parsed.draft,
      };
    }

    if (
      "text" in content &&
      typeof (content as { text?: unknown }).text === "string"
    ) {
      return parseDraftContent((content as { text: string }).text);
    }
  }

  throw new Error("OPENROUTER_INVALID_RESPONSE");
}

export async function generateVocabularyDraft(
  input: SelectedWordActionInput,
): Promise<VocabularyDraft> {
  const response = await requestOpenRouterDraft(input);
  const rawResponseText = await response.text();

  if (!response.ok) {
    throw new Error("OPENROUTER_PROVIDER_ERROR");
  }

  let parsedResponseJson: OpenRouterResponse;

  try {
    parsedResponseJson = openRouterResponseSchema.parse(
      JSON.parse(rawResponseText),
    );
  } catch {
    throw new Error("OPENROUTER_INVALID_RESPONSE");
  }

  const content = parsedResponseJson.choices[0]?.message.content;
  const draft = parseDraftFromUnknownContent(content);

  return {
    ...draft,
    recordId: input.recordId,
    sourceWord: input.selectedWord,
  };
}
