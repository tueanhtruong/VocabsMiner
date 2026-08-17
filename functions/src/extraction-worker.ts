import { createHash, randomUUID } from "node:crypto";

import {
  FieldValue,
  Timestamp,
  getFirestore as getAdminFirestore,
  type DocumentReference,
  type DocumentData,
} from "firebase-admin/firestore";
import { getApps, initializeApp } from "firebase-admin/app";
import { logger } from "firebase-functions";
import { z } from "zod";

type VocabularyItem = {
  word: string;
  type: string;
  phonetic: string;
  definition: string;
  vietnamese: string;
};

type PassageRecord = {
  uid: string;
  passage: string;
  status?: "pending" | "completed" | "error";
  activeAttemptId?: string;
};

type VocabularyDocument = {
  occurrenceCount?: number;
  passageRefs?: string[];
};

type OpenRouterErrorCode =
  | "MISSING_API_KEY"
  | "RATE_LIMITED"
  | "PROVIDER_ERROR"
  | "INVALID_RESPONSE";

class WorkerExtractionError extends Error {
  constructor(
    public readonly code: OpenRouterErrorCode,
    message: string,
  ) {
    super(message);
  }
}

const vocabularyItemSchema = z.object({
  word: z.string().trim().min(1),
  type: z.string().trim().min(1),
  phonetic: z.string().trim().min(1),
  definition: z.string().trim().min(1),
  vietnamese: z.string().trim().min(1),
});

const extractionResponseSchema = z.object({
  vocabulary: z.array(vocabularyItemSchema),
});

function getFirestore() {
  if (!getApps().length) {
    initializeApp();
  }

  return getAdminFirestore();
}

function normalizeVocabulary(vocabulary: VocabularyItem[]) {
  return vocabulary.map((item) => ({
    word: item.word.trim(),
    type: item.type.trim(),
    phonetic: item.phonetic.trim(),
    definition: item.definition.trim(),
    vietnamese: item.vietnamese.trim(),
  }));
}

function toVocabularyId(normalizedWord: string) {
  const slug = normalizedWord
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return (
    slug || `word-${createHash("sha256").update(normalizedWord).digest("hex").slice(0, 16)}`
  );
}

function sanitizeProviderError(error: unknown) {
  if (error instanceof WorkerExtractionError) {
    if (error.code === "RATE_LIMITED") {
      return "Extraction provider is currently busy. Please retry shortly.";
    }

    if (error.code === "MISSING_API_KEY") {
      return "Extraction service is not configured. Please try again later.";
    }

    if (error.code === "INVALID_RESPONSE") {
      return "Extraction provider returned an invalid result. Please retry.";
    }
  }

  return "Extraction provider is currently unavailable. Please retry.";
}

function cleanJsonContent(rawContent: string) {
  return rawContent
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function buildExtractionPrompt(passage: string) {
  return `Extract all Level B and above academic vocabulary from the passage below
Rules:
- Include only words/phrases that are academic, formal, or topic-specific (exclude basic everyday words)
- Prefer words useful for IELTS Writing/Reading
- Return STRICT JSON only - no explanation, no markdown, no extra text
Output shape:
{"vocabulary":[{"word":"","type":"","phonetic":"","definition":"","vietnamese":""}]}
Passage:
"""
${passage}
"""`;
}

async function extractVocabulary(passage: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new WorkerExtractionError("MISSING_API_KEY", "Missing API key");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a JSON-only response API. Never include markdown or explanation.",
        },
        { role: "user", content: buildExtractionPrompt(passage) },
      ],
      temperature: 0.1,
    }),
    signal: AbortSignal.timeout(540_000),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new WorkerExtractionError(
      response.status === 429 ? "RATE_LIMITED" : "PROVIDER_ERROR",
      `Provider returned ${response.status}: ${responseText.slice(0, 200)}`,
    );
  }

  try {
    const responseJson = JSON.parse(responseText) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    const content = responseJson.choices?.[0]?.message?.content;
    const rawContent =
      typeof content === "string"
        ? content
        : content && typeof content === "object" && "text" in content
          ? String((content as { text: unknown }).text)
          : "";
    const parsed = extractionResponseSchema.parse(
      JSON.parse(cleanJsonContent(rawContent)),
    );

    return normalizeVocabulary(parsed.vocabulary);
  } catch {
    throw new WorkerExtractionError(
      "INVALID_RESPONSE",
      "Provider returned an invalid result",
    );
  }
}

async function claimPassage(uid: string, recordId: string) {
  const db = getFirestore();
  const passageRef = db.collection("users").doc(uid).collection("passages").doc(recordId);
  const attemptId = randomUUID();

  const claimed = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(passageRef);
    const data = snapshot.data() as PassageRecord | undefined;

    if (!snapshot.exists || data?.status !== "pending" || data.activeAttemptId) {
      return null;
    }

    transaction.update(passageRef, {
      activeAttemptId: attemptId,
      updatedAt: Timestamp.now(),
    });

    return { passage: data.passage, attemptId };
  });

  return { passageRef, ...claimed };
}

async function finalizeSuccess(
  uid: string,
  recordId: string,
  passageRef: DocumentReference,
  attemptId: string,
  vocabulary: VocabularyItem[],
) {
  const db = getFirestore();

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(passageRef);
    const data = snapshot.data() as PassageRecord | undefined;

    if (!data || data.activeAttemptId !== attemptId) {
      return false;
    }

    const vocabularyRef = passageRef.parent.parent?.collection("vocabulary");
    const userRef = passageRef.parent.parent;
    const combinedItems = new Map<
      string,
      { item: VocabularyItem; count: number }
    >();

    for (const item of vocabulary) {
      const normalizedWord = item.word.trim().toLowerCase().replace(/\s+/g, " ");

      if (!normalizedWord) {
        continue;
      }

      const existing = combinedItems.get(normalizedWord);
      if (existing) {
        existing.count += 1;
      } else {
        combinedItems.set(normalizedWord, { item, count: 1 });
      }
    }

    const existingVocabulary = new Map<
      string,
      VocabularyDocument | undefined
    >();

    if (vocabularyRef) {
      for (const [normalizedWord] of combinedItems) {
        const snapshot = await transaction.get(
          vocabularyRef.doc(toVocabularyId(normalizedWord)),
        );
        existingVocabulary.set(
          normalizedWord,
          snapshot.data() as VocabularyDocument | undefined,
        );
      }
    }

    let createdCount = 0;
    const now = Timestamp.now();

    if (vocabularyRef) {
      for (const [normalizedWord, value] of combinedItems) {
        const vocabularyId = toVocabularyId(normalizedWord);
        const vocabularyDocRef = vocabularyRef.doc(vocabularyId);
        const old = existingVocabulary.get(normalizedWord);

        if (!old) {
          transaction.set(vocabularyDocRef, {
            vocabularyId,
            uid,
            word: value.item.word,
            normalizedWord,
            definition: value.item.definition,
            vietnamese: value.item.vietnamese,
            firstSeenAt: now,
            lastSeenAt: now,
            occurrenceCount: value.count,
            passageRefs: [recordId],
          });
          createdCount += 1;
        } else {
          transaction.set(
            vocabularyDocRef,
            {
              word: value.item.word,
              definition: value.item.definition,
              vietnamese: value.item.vietnamese,
              lastSeenAt: now,
              occurrenceCount:
                Number(old.occurrenceCount ?? 0) + value.count,
              passageRefs: Array.from(
                new Set([...(old.passageRefs ?? []), recordId]),
              ),
            },
            { merge: true },
          );
        }
      }
    }

    transaction.update(passageRef, {
      vocabularyList: vocabulary,
      vocabularyCount: vocabulary.length,
      status: "completed",
      updatedAt: Timestamp.now(),
      activeAttemptId: FieldValue.delete(),
      errorReason: FieldValue.delete(),
    });

    if (createdCount && userRef) {
      transaction.set(
        userRef,
        {
          uid,
          totalVocabularySaved: FieldValue.increment(createdCount),
          updatedAt: now,
        },
        { merge: true },
      );
    }

    return true;
  });
}

async function finalizeFailure(
  passageRef: DocumentReference,
  attemptId: string,
  errorReason: string,
) {
  const db = getFirestore();

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(passageRef);
    const data = snapshot.data() as PassageRecord | undefined;

    if (!data || data.activeAttemptId !== attemptId) {
      return false;
    }

    transaction.update(passageRef, {
      vocabularyList: [],
      vocabularyCount: 0,
      status: "error",
      errorReason,
      updatedAt: Timestamp.now(),
      activeAttemptId: FieldValue.delete(),
    });

    return true;
  });
}

export async function processPendingPassage(params: {
  uid: string;
  recordId: string;
  before?: DocumentData;
  after?: DocumentData;
}) {
  if (params.after?.status !== "pending") {
    return;
  }

  const claim = await claimPassage(params.uid, params.recordId);

  if (!claim.attemptId || !claim.passage) {
    return;
  }

  try {
    const vocabulary = await extractVocabulary(claim.passage);
    await finalizeSuccess(
      params.uid,
      params.recordId,
      claim.passageRef,
      claim.attemptId,
      vocabulary,
    );
  } catch (error) {
    logger.error("Background vocabulary extraction failed", {
      uid: params.uid,
      recordId: params.recordId,
      error,
    });
    await finalizeFailure(
      claim.passageRef,
      claim.attemptId,
      sanitizeProviderError(error),
    );
  }
}
