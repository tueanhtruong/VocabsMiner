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
  paragraphs?: PassageParagraph[];
  status?: "pending" | "completed" | "error";
  pendingSince?: Timestamp;
  createdAt?: Timestamp;
  activeAttemptId?: string;
};

type PassageParagraph = {
  paragraphId: string;
  index: number;
  sourceText: string;
  sourceHash: string;
  translation?: string;
  translationState?: "missing" | "available" | "generating" | "error";
  translationError?: string;
  translationOperationId?: string;
  translationOperationStartedAt?: Timestamp;
  translationOperationExpiresAt?: Timestamp;
  translationUpdatedAt?: Timestamp;
};

type VocabularyDocument = {
  occurrenceCount?: number;
  passageRefs?: string[];
};

function getPendingSince(data: PassageRecord) {
  if (data.pendingSince instanceof Timestamp) {
    return data.pendingSince;
  }

  if (data.createdAt instanceof Timestamp) {
    return data.createdAt;
  }

  return undefined;
}

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

const paragraphTranslationResponseSchema = z.object({
  translation: z.string().trim().min(1),
});

const translationOperationLeaseMs = 10 * 60 * 1000;

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

function normalizeParagraphSourceText(passage: string) {
  const normalized = passage.replace(/\r\n?/g, "\n").trim();

  if (!normalized) {
    return [];
  }

  // If passage contains blank line separations, split by blank lines.
  if (/\n\s*\n/.test(normalized)) {
    return normalized
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }

  // Otherwise, if passage is delimited by single newlines, split by line breaks.
  return normalized
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function hashParagraph(sourceText: string) {
  return createHash("sha256").update(sourceText).digest("hex");
}

function buildParagraphId(index: number, sourceText: string) {
  return `p-${index}-${hashParagraph(sourceText).slice(0, 16)}`;
}

function buildPassageParagraphs(passage: string): PassageParagraph[] {
  return normalizeParagraphSourceText(passage).map((sourceText, index) => ({
    paragraphId: buildParagraphId(index, sourceText),
    index,
    sourceText,
    sourceHash: hashParagraph(sourceText),
    translationState: "missing",
  }));
}

function getPassageParagraphs(data: PassageRecord) {
  if (Array.isArray(data.paragraphs) && data.paragraphs.length > 0) {
    const normalized = data.paragraphs
      .filter((paragraph) => paragraph.sourceText?.trim())
      .map((paragraph, index) => ({
        ...paragraph,
        index,
        sourceText: paragraph.sourceText.trim(),
        sourceHash: paragraph.sourceHash || hashParagraph(paragraph.sourceText),
        translationState:
          paragraph.translationState ??
          (paragraph.translation ? "available" : "missing"),
      }));

    const expectedParagraphs = buildPassageParagraphs(data.passage);
    const hasUnsplitParagraphs =
      normalized.length === 1 &&
      expectedParagraphs.length > 1 &&
      /\n/.test(normalized[0].sourceText);

    if (!hasUnsplitParagraphs) {
      return normalized;
    }
  }

  return buildPassageParagraphs(data.passage);
}

function toVocabularyId(normalizedWord: string) {
  const slug = normalizedWord
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return (
    slug ||
    `word-${createHash("sha256").update(normalizedWord).digest("hex").slice(0, 16)}`
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

function buildParagraphTranslationPrompt(paragraph: string) {
  return `Translate the following English paragraph into natural Vietnamese.
Rules:
- Preserve the complete meaning and tone of the source paragraph
- Return STRICT JSON only - no explanation, no markdown, no extra text
Output shape:
{"translation":""}
Paragraph:
"""
${paragraph}
"""`;
}

async function extractVocabulary(passage: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new WorkerExtractionError("MISSING_API_KEY", "Missing API key");
  }

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
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
    },
  );

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

function parseParagraphTranslation(content: unknown) {
  let rawContent = "";

  if (typeof content === "string") {
    rawContent = content;
  } else if (
    content &&
    typeof content === "object" &&
    "text" in content &&
    typeof content.text === "string"
  ) {
    rawContent = content.text;
  } else if (content && typeof content === "object") {
    return paragraphTranslationResponseSchema.parse(content).translation;
  }

  const cleanedContent = cleanJsonContent(rawContent);

  if (!cleanedContent) {
    throw new WorkerExtractionError(
      "INVALID_RESPONSE",
      "Provider returned empty translation content",
    );
  }

  try {
    return paragraphTranslationResponseSchema.parse(JSON.parse(cleanedContent))
      .translation;
  } catch {
    throw new WorkerExtractionError(
      "INVALID_RESPONSE",
      "Provider returned an invalid translation",
    );
  }
}

async function translateParagraph(paragraph: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new WorkerExtractionError("MISSING_API_KEY", "Missing API key");
  }

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
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
          {
            role: "user",
            content: buildParagraphTranslationPrompt(paragraph),
          },
        ],
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(540_000),
    },
  );

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

    return parseParagraphTranslation(content);
  } catch (error) {
    if (error instanceof WorkerExtractionError) {
      throw error;
    }

    throw new WorkerExtractionError(
      "INVALID_RESPONSE",
      "Provider returned an invalid translation response",
    );
  }
}

function withoutTranslationOperation(paragraph: PassageParagraph) {
  const withoutOperation = { ...paragraph };

  delete withoutOperation.translationOperationId;
  delete withoutOperation.translationOperationStartedAt;
  delete withoutOperation.translationOperationExpiresAt;

  return withoutOperation;
}

function withoutTranslationError(paragraph: PassageParagraph) {
  const withoutError = { ...paragraph };

  delete withoutError.translationError;

  return withoutError;
}

function hasExpiredTranslationOperation(
  paragraph: PassageParagraph,
  now: Timestamp,
) {
  return Boolean(
    paragraph.translationState === "generating" &&
    paragraph.translationOperationExpiresAt &&
    paragraph.translationOperationExpiresAt.toMillis() <= now.toMillis(),
  );
}

async function claimParagraphTranslation(
  passageRef: DocumentReference,
  paragraphId: string,
) {
  const operationId = randomUUID();
  const db = getFirestore();

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(passageRef);
    const data = snapshot.data() as PassageRecord | undefined;

    if (!data) {
      return null;
    }

    const paragraphs = getPassageParagraphs(data);
    const currentParagraph = paragraphs.find(
      (paragraph) => paragraph.paragraphId === paragraphId,
    );
    const now = Timestamp.now();

    if (!currentParagraph) {
      return null;
    }

    if (
      currentParagraph.translationState === "generating" &&
      !hasExpiredTranslationOperation(currentParagraph, now)
    ) {
      return null;
    }

    const updatedParagraph = {
      ...withoutTranslationError(withoutTranslationOperation(currentParagraph)),
      translationState: "generating" as const,
      translationOperationId: operationId,
      translationOperationStartedAt: now,
      translationOperationExpiresAt: Timestamp.fromMillis(
        now.toMillis() + translationOperationLeaseMs,
      ),
    };
    const updatedParagraphs = paragraphs.map((paragraph) =>
      paragraph.paragraphId === paragraphId ? updatedParagraph : paragraph,
    );

    transaction.update(passageRef, {
      paragraphs: updatedParagraphs,
      updatedAt: now,
    });

    return {
      operationId,
      sourceText: currentParagraph.sourceText,
    };
  });
}

async function completeParagraphTranslation(
  passageRef: DocumentReference,
  paragraphId: string,
  operationId: string,
  translation: string,
) {
  const db = getFirestore();

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(passageRef);
    const data = snapshot.data() as PassageRecord | undefined;

    if (!data) {
      return false;
    }

    const paragraphs = getPassageParagraphs(data);
    const currentParagraph = paragraphs.find(
      (paragraph) => paragraph.paragraphId === paragraphId,
    );

    if (
      !currentParagraph ||
      currentParagraph.translationOperationId !== operationId
    ) {
      return false;
    }

    const now = Timestamp.now();
    const updatedParagraph = {
      ...withoutTranslationError(withoutTranslationOperation(currentParagraph)),
      translation: translation.trim(),
      translationState: "available" as const,
      translationUpdatedAt: now,
    };
    const updatedParagraphs = paragraphs.map((paragraph) =>
      paragraph.paragraphId === paragraphId ? updatedParagraph : paragraph,
    );

    transaction.update(passageRef, {
      paragraphs: updatedParagraphs,
      updatedAt: now,
    });

    return true;
  });
}

async function failParagraphTranslation(
  passageRef: DocumentReference,
  paragraphId: string,
  operationId: string,
  errorReason: string,
) {
  const db = getFirestore();

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(passageRef);
    const data = snapshot.data() as PassageRecord | undefined;

    if (!data) {
      return false;
    }

    const paragraphs = getPassageParagraphs(data);
    const currentParagraph = paragraphs.find(
      (paragraph) => paragraph.paragraphId === paragraphId,
    );

    if (
      !currentParagraph ||
      currentParagraph.translationOperationId !== operationId
    ) {
      return false;
    }

    const updatedParagraph = {
      ...withoutTranslationOperation(currentParagraph),
      translationState: "error" as const,
      translationError:
        errorReason.trim() || "Translation failed. Please retry.",
    };
    const updatedParagraphs = paragraphs.map((paragraph) =>
      paragraph.paragraphId === paragraphId ? updatedParagraph : paragraph,
    );

    transaction.update(passageRef, {
      paragraphs: updatedParagraphs,
      updatedAt: Timestamp.now(),
    });

    return true;
  });
}

async function processParagraphTranslation(
  passageRef: DocumentReference,
  paragraph: PassageParagraph,
) {
  const claim = await claimParagraphTranslation(
    passageRef,
    paragraph.paragraphId,
  );

  if (!claim) {
    return;
  }

  try {
    const translation = await translateParagraph(claim.sourceText);
    await completeParagraphTranslation(
      passageRef,
      paragraph.paragraphId,
      claim.operationId,
      translation,
    );
  } catch (error) {
    logger.error("Paragraph translation failed", {
      paragraphId: paragraph.paragraphId,
      error,
    });
    await failParagraphTranslation(
      passageRef,
      paragraph.paragraphId,
      claim.operationId,
      sanitizeProviderError(error),
    );
  }
}

async function processParagraphTranslations(
  passageRef: DocumentReference,
  paragraphs: PassageParagraph[],
) {
  const batchSize = 3;

  for (let start = 0; start < paragraphs.length; start += batchSize) {
    const batch = paragraphs.slice(start, start + batchSize);
    await Promise.all(
      batch.map((paragraph) =>
        processParagraphTranslation(passageRef, paragraph),
      ),
    );
  }
}

async function claimPassage(uid: string, recordId: string) {
  const db = getFirestore();
  const passageRef = db
    .collection("users")
    .doc(uid)
    .collection("passages")
    .doc(recordId);
  const attemptId = randomUUID();

  const claimed = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(passageRef);
    const data = snapshot.data() as PassageRecord | undefined;

    if (
      !snapshot.exists ||
      data?.status !== "pending" ||
      data.activeAttemptId
    ) {
      return null;
    }

    const paragraphs = getPassageParagraphs(data);

    transaction.update(passageRef, {
      activeAttemptId: attemptId,
      pendingSince: getPendingSince(data) ?? Timestamp.now(),
      paragraphs,
      updatedAt: Timestamp.now(),
    });

    return { passage: data.passage, attemptId, paragraphs };
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
      const normalizedWord = item.word
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

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
              occurrenceCount: Number(old.occurrenceCount ?? 0) + value.count,
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
      pendingSince: FieldValue.delete(),
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
      pendingSince: FieldValue.delete(),
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

  const translationPromise = processParagraphTranslations(
    claim.passageRef,
    claim.paragraphs ?? [],
  ).catch((error) => {
    logger.error("Paragraph translation batch failed", {
      uid: params.uid,
      recordId: params.recordId,
      error,
    });
  });

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

  await translationPromise;
}
