import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { FieldValue, Timestamp, type Query } from "firebase-admin/firestore";

import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";

export type LearnerProfile = {
  uid: string;
  email?: string;
  displayName?: string;
  photoUrl?: string;
  provider: "google.com";
  preferredTarget: string;
  totalPassages: number;
  totalVocabularySaved: number;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  updatedAt: Timestamp;
};

export type LearnerProfileDto = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoUrl: string | null;
};

export type VocabularyItemInput = {
  word: string;
  type: string;
  phonetic: string;
  definition: string;
  vietnamese: string;
};

export type PassageStatus = "pending" | "completed" | "error";

export type ParagraphTranslationState =
  | "missing"
  | "available"
  | "generating"
  | "error";

export type StoredPassageParagraph = {
  paragraphId: string;
  index: number;
  sourceText: string;
  sourceHash: string;
  translation?: string;
  translationState: ParagraphTranslationState;
  translationError?: string;
  translationUpdatedAt?: Timestamp;
  translationOperationId?: string;
  translationOperationStartedAt?: Timestamp;
  translationOperationExpiresAt?: Timestamp;
};

export type PassageParagraphDto = {
  paragraphId: string;
  index: number;
  sourceText: string;
  translation?: string;
  translationState: ParagraphTranslationState;
  translationError?: string;
  translationUpdatedAt?: string;
};

export type StoredVocabularyItem = {
  vocabularyId: string;
  uid: string;
  word: string;
  normalizedWord: string;
  definition: string;
  vietnamese: string;
  firstSeenAt: Timestamp;
  lastSeenAt: Timestamp;
  occurrenceCount: number;
  passageRefs: string[];
};

export type PassageHistoryItem = {
  recordId: string;
  extractionId: string;
  uid: string;
  title: string;
  passage: string;
  paragraphs?: StoredPassageParagraph[];
  vocabularyList: VocabularyItemInput[];
  previewText: string;
  passageHash: string;
  vocabularyCount: number;
  status: PassageStatus;
  pendingSince?: Timestamp;
  errorReason?: string;
  activeAttemptId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type VocabularyApiItem = {
  vocabularyId: string;
  word: string;
  definition: string;
  vietnamese: string;
  firstSeenAt: string;
  lastSeenAt: string;
  occurrenceCount: number;
};

export type PassageApiItem = {
  recordId: string;
  title: string;
  previewText: string;
  createdAt: string;
  vocabularyCount: number;
  status: PassageStatus;
  errorReason?: string;
};

export type PassageDetailApiItem = {
  recordId: string;
  title: string;
  passage: string;
  paragraphs: PassageParagraphDto[];
  vocabularyList: VocabularyItemInput[];
  createdAt: string;
  vocabularyCount: number;
  status: PassageStatus;
  pendingSince?: string;
  errorReason?: string;
};

const defaultVocabularyLimit = 500;
const maxVocabularyLimit = 1000;

const defaultHistoryLimit = 500;
const maxHistoryLimit = 1000;
export const staleExtractionThresholdMs = 15 * 60 * 1000;

export function getUserDocRef(uid: string) {
  return getFirebaseAdminFirestore().collection("users").doc(uid);
}

export function getUserPassagesCollectionRef(uid: string) {
  return getUserDocRef(uid).collection("passages");
}

export function getUserVocabularyCollectionRef(uid: string) {
  return getUserDocRef(uid).collection("vocabulary");
}

function toDateIsoString(value: Timestamp | undefined) {
  return (value ?? Timestamp.now()).toDate().toISOString();
}

function isValidTimestamp(value: Timestamp | undefined): value is Timestamp {
  return value instanceof Timestamp && Number.isFinite(value.toMillis());
}

export function getPendingSince(data: Partial<PassageHistoryItem>) {
  if (isValidTimestamp(data.pendingSince)) {
    return data.pendingSince;
  }

  return isValidTimestamp(data.createdAt) ? data.createdAt : undefined;
}

export function isStalePendingPassage(
  data: Partial<PassageHistoryItem>,
  now = Timestamp.now(),
) {
  if (getPassageStatus(data) !== "pending") {
    return false;
  }

  const pendingSince = getPendingSince(data);

  return (
    pendingSince !== undefined &&
    now.toMillis() - pendingSince.toMillis() > staleExtractionThresholdMs
  );
}

function normalizeWord(word: string) {
  return word.trim().toLowerCase().replace(/\s+/g, " ");
}

function toVocabularyId(normalizedWord: string) {
  const slug = normalizedWord
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug.length > 0) {
    return slug;
  }

  return `word-${createHash("sha256").update(normalizedWord).digest("hex").slice(0, 16)}`;
}

function buildPassagePreview(passage: string, maxLength = 180) {
  const trimmed = passage.trim().replace(/\s+/g, " ");

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 1)}…`;
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

function buildParagraphId(index: number, sourceText: string) {
  return `p-${index}-${hashPassage(sourceText).slice(0, 16)}`;
}

export function buildPassageParagraphs(
  passage: string,
): StoredPassageParagraph[] {
  return normalizeParagraphSourceText(passage).map((sourceText, index) => ({
    paragraphId: buildParagraphId(index, sourceText),
    index,
    sourceText,
    sourceHash: hashPassage(sourceText),
    translationState: "missing" as const,
  }));
}

function normalizeStoredParagraph(
  paragraph: Partial<StoredPassageParagraph>,
  fallbackIndex: number,
) {
  const sourceText = (paragraph.sourceText ?? "").trim();

  if (!sourceText) {
    return null;
  }

  const translation = paragraph.translation?.trim();
  const translationState =
    paragraph.translationState === "available" && translation
      ? "available"
      : paragraph.translationState === "generating"
        ? "generating"
        : paragraph.translationState === "error"
          ? "error"
          : translation
            ? "available"
            : "missing";

  return {
    paragraphId:
      paragraph.paragraphId?.trim() ||
      buildParagraphId(fallbackIndex, sourceText),
    index: fallbackIndex,
    sourceText,
    sourceHash: paragraph.sourceHash ?? hashPassage(sourceText),
    ...(translation ? { translation } : {}),
    translationState,
    ...(paragraph.translationError
      ? { translationError: paragraph.translationError }
      : {}),
    ...(paragraph.translationUpdatedAt
      ? { translationUpdatedAt: paragraph.translationUpdatedAt }
      : {}),
    ...(paragraph.translationOperationId
      ? { translationOperationId: paragraph.translationOperationId }
      : {}),
    ...(paragraph.translationOperationStartedAt
      ? {
          translationOperationStartedAt:
            paragraph.translationOperationStartedAt,
        }
      : {}),
    ...(paragraph.translationOperationExpiresAt
      ? {
          translationOperationExpiresAt:
            paragraph.translationOperationExpiresAt,
        }
      : {}),
  } satisfies StoredPassageParagraph;
}

function getPassageParagraphs(
  data: Partial<PassageHistoryItem>,
  passage: string,
) {
  if (Array.isArray(data.paragraphs)) {
    const normalized = data.paragraphs
      .map((paragraph, index) => normalizeStoredParagraph(paragraph, index))
      .filter(
        (paragraph): paragraph is StoredPassageParagraph => paragraph !== null,
      )
      .sort((left, right) => left.index - right.index)
      .map((paragraph, index) => ({ ...paragraph, index }));

    // If existing stored paragraphs were not split properly (e.g. 1 stored paragraph
    // containing multiple paragraphs that should have been separated), re-split the passage.
    const expectedParagraphs = buildPassageParagraphs(passage);
    const hasUnsplitParagraphs =
      normalized.length === 1 &&
      expectedParagraphs.length > 1 &&
      /\n/.test(normalized[0].sourceText);

    if (!hasUnsplitParagraphs) {
      return normalized;
    }
  }

  return buildPassageParagraphs(passage);
}

export function toPassageParagraphDto(
  paragraph: StoredPassageParagraph,
): PassageParagraphDto {
  return {
    paragraphId: paragraph.paragraphId,
    index: paragraph.index,
    sourceText: paragraph.sourceText,
    ...(paragraph.translation ? { translation: paragraph.translation } : {}),
    translationState: paragraph.translationState,
    ...(paragraph.translationError
      ? { translationError: paragraph.translationError }
      : {}),
    ...(paragraph.translationUpdatedAt
      ? {
          translationUpdatedAt: toDateIsoString(paragraph.translationUpdatedAt),
        }
      : {}),
  };
}

export const translationOperationLeaseMs = 10 * 60 * 1000;

function withoutTranslationOperation(paragraph: StoredPassageParagraph) {
  const withoutOperation = { ...paragraph };

  delete withoutOperation.translationOperationId;
  delete withoutOperation.translationOperationStartedAt;
  delete withoutOperation.translationOperationExpiresAt;

  return withoutOperation;
}

function withoutTranslationError(paragraph: StoredPassageParagraph) {
  const withoutError = { ...paragraph };

  delete withoutError.translationError;

  return withoutError;
}

function withoutTranslationValue(paragraph: StoredPassageParagraph) {
  const withoutValue = { ...paragraph };

  delete withoutValue.translation;
  delete withoutValue.translationUpdatedAt;

  return withoutValue;
}

function findPassageParagraph(
  paragraphs: StoredPassageParagraph[],
  paragraphId: string,
) {
  return paragraphs.find((paragraph) => paragraph.paragraphId === paragraphId);
}

function hasExpiredTranslationOperation(
  paragraph: StoredPassageParagraph,
  now: Timestamp,
) {
  return Boolean(
    paragraph.translationState === "generating" &&
    paragraph.translationOperationExpiresAt &&
    paragraph.translationOperationExpiresAt.toMillis() <= now.toMillis(),
  );
}

function resolvePassageTitle(title: string | undefined, passage: string) {
  const normalized = title?.trim();

  if (normalized) {
    return normalized;
  }

  const fallback = buildPassagePreview(passage, 60);
  return fallback || "Untitled passage";
}

function normalizeVocabularyItem(item: Partial<VocabularyItemInput>) {
  return {
    word: (item.word ?? "").trim(),
    type: (item.type ?? "").trim(),
    phonetic: (item.phonetic ?? "").trim(),
    definition: (item.definition ?? "").trim(),
    vietnamese: (item.vietnamese ?? "").trim(),
  } satisfies VocabularyItemInput;
}

function getPassageStatus(data: Partial<PassageHistoryItem>): PassageStatus {
  if (
    data.status === "pending" ||
    data.status === "completed" ||
    data.status === "error"
  ) {
    return data.status;
  }

  // Records written before background extraction are completed records.
  return "completed";
}

function getPassageVocabularyList(data: Partial<PassageHistoryItem>) {
  return (data.vocabularyList ?? []).map((item) =>
    normalizeVocabularyItem(item),
  );
}

function getPassageVocabularyCount(
  status: PassageStatus,
  vocabularyList: VocabularyItemInput[],
) {
  return status === "completed" ? vocabularyList.length : 0;
}

function encodeCursor(payload: Record<string, string | number>) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodeCursor(cursor: string) {
  try {
    const payload = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    );

    if (!payload || typeof payload !== "object") {
      throw new Error("INVALID_CURSOR");
    }

    return payload as Record<string, string | number>;
  } catch {
    throw new Error("INVALID_CURSOR");
  }
}

function safeLimit(value: number | undefined, fallback: number, max: number) {
  if (!value || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(Math.max(Math.floor(value), 1), max);
}

export async function upsertLearnerProfile(params: {
  uid: string;
  email?: string;
  displayName?: string;
  photoUrl?: string;
}) {
  const now = Timestamp.now();
  const userDocRef = getUserDocRef(params.uid);
  const existingProfileSnapshot = await userDocRef.get();
  const existingProfile = existingProfileSnapshot.data() as
    | LearnerProfile
    | undefined;

  await userDocRef.set(
    {
      uid: params.uid,
      email: params.email ?? existingProfile?.email,
      displayName: params.displayName ?? existingProfile?.displayName,
      photoUrl: params.photoUrl ?? existingProfile?.photoUrl,
      provider: "google.com",
      preferredTarget: existingProfile?.preferredTarget ?? "Band 6+",
      totalPassages: existingProfile?.totalPassages ?? 0,
      totalVocabularySaved: existingProfile?.totalVocabularySaved ?? 0,
      createdAt: existingProfile?.createdAt ?? now,
      lastLoginAt: now,
      updatedAt: now,
    } satisfies LearnerProfile,
    { merge: true },
  );
}

export async function getLearnerProfileByUid(uid: string) {
  const snapshot = await getUserDocRef(uid).get();

  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() as LearnerProfile;

  return {
    uid: data.uid,
    displayName: data.displayName ?? null,
    email: data.email ?? null,
    photoUrl: data.photoUrl ?? null,
  } satisfies LearnerProfileDto;
}

export function hashPassage(passage: string) {
  return createHash("sha256").update(passage).digest("hex");
}

export async function recordPassageHistory(params: {
  uid: string;
  extractionId: string;
  title: string;
  passageText: string;
  vocabulary: VocabularyItemInput[];
  vocabularyCount: number;
  createdAt?: Timestamp;
}) {
  const createdAt = params.createdAt ?? Timestamp.now();
  const updatedAt = createdAt;
  const resolvedTitle = resolvePassageTitle(params.title, params.passageText);
  const passageRef = getUserPassagesCollectionRef(params.uid).doc(
    params.extractionId,
  );
  const userRef = getUserDocRef(params.uid);

  const normalizedVocabulary = params.vocabulary.map((item) =>
    normalizeVocabularyItem(item),
  );
  const paragraphs = buildPassageParagraphs(params.passageText);

  await getFirebaseAdminFirestore().runTransaction(async (transaction) => {
    transaction.set(
      passageRef,
      {
        recordId: params.extractionId,
        extractionId: params.extractionId,
        uid: params.uid,
        title: resolvedTitle,
        passage: params.passageText,
        paragraphs,
        vocabularyList: normalizedVocabulary,
        previewText: buildPassagePreview(params.passageText),
        passageHash: hashPassage(params.passageText),
        vocabularyCount: normalizedVocabulary.length,
        status: "completed",
        createdAt,
        updatedAt,
      } satisfies PassageHistoryItem,
      { merge: true },
    );

    transaction.set(
      userRef,
      {
        uid: params.uid,
        totalPassages: FieldValue.increment(1),
        updatedAt: createdAt,
      },
      { merge: true },
    );
  });
}

export async function createPendingPassage(params: {
  uid: string;
  recordId: string;
  title: string;
  passageText: string;
  createdAt?: Timestamp;
}) {
  const createdAt = params.createdAt ?? Timestamp.now();
  const passageRef = getUserPassagesCollectionRef(params.uid).doc(
    params.recordId,
  );
  const userRef = getUserDocRef(params.uid);
  const resolvedTitle = resolvePassageTitle(params.title, params.passageText);
  const paragraphs = buildPassageParagraphs(params.passageText);

  await getFirebaseAdminFirestore().runTransaction(async (transaction) => {
    transaction.create(passageRef, {
      recordId: params.recordId,
      extractionId: params.recordId,
      uid: params.uid,
      title: resolvedTitle,
      passage: params.passageText,
      paragraphs,
      vocabularyList: [],
      previewText: buildPassagePreview(params.passageText),
      passageHash: hashPassage(params.passageText),
      vocabularyCount: 0,
      status: "pending",
      pendingSince: createdAt,
      createdAt,
      updatedAt: createdAt,
    });

    transaction.set(
      userRef,
      {
        uid: params.uid,
        totalPassages: FieldValue.increment(1),
        updatedAt: createdAt,
      },
      { merge: true },
    );
  });

  return {
    recordId: params.recordId,
    title: resolvedTitle,
    passage: params.passageText,
    paragraphs,
    createdAt,
    pendingSince: createdAt,
  };
}

export async function claimPendingPassage(params: {
  uid: string;
  recordId: string;
}) {
  const attemptId = randomUUID();
  const passageRef = getUserPassagesCollectionRef(params.uid).doc(
    params.recordId,
  );

  return getFirebaseAdminFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(passageRef);

    if (!snapshot.exists) {
      return null;
    }

    const data = snapshot.data() as PassageHistoryItem;

    if (getPassageStatus(data) !== "pending" || data.activeAttemptId) {
      return null;
    }

    const now = Timestamp.now();

    transaction.update(passageRef, {
      activeAttemptId: attemptId,
      pendingSince: getPendingSince(data) ?? now,
      updatedAt: now,
    });

    return {
      attemptId,
      title: data.title,
      passage: data.passage,
      paragraphs: getPassageParagraphs(data, data.passage ?? ""),
    };
  });
}

export async function completeClaimedPassage(params: {
  uid: string;
  recordId: string;
  attemptId: string;
  vocabulary: VocabularyItemInput[];
}) {
  const passageRef = getUserPassagesCollectionRef(params.uid).doc(
    params.recordId,
  );
  const vocabularyList = params.vocabulary.map((item) =>
    normalizeVocabularyItem(item),
  );

  return getFirebaseAdminFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(passageRef);

    if (
      !snapshot.exists ||
      (snapshot.data() as PassageHistoryItem).activeAttemptId !==
        params.attemptId
    ) {
      return false;
    }

    transaction.update(passageRef, {
      vocabularyList,
      vocabularyCount: vocabularyList.length,
      status: "completed",
      updatedAt: Timestamp.now(),
      pendingSince: FieldValue.delete(),
      activeAttemptId: FieldValue.delete(),
      errorReason: FieldValue.delete(),
    });

    return true;
  });
}

export async function failClaimedPassage(params: {
  uid: string;
  recordId: string;
  attemptId: string;
  errorReason: string;
}) {
  const passageRef = getUserPassagesCollectionRef(params.uid).doc(
    params.recordId,
  );

  return getFirebaseAdminFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(passageRef);

    if (
      !snapshot.exists ||
      (snapshot.data() as PassageHistoryItem).activeAttemptId !==
        params.attemptId
    ) {
      return false;
    }

    transaction.update(passageRef, {
      vocabularyList: [],
      vocabularyCount: 0,
      status: "error",
      errorReason: params.errorReason,
      updatedAt: Timestamp.now(),
      pendingSince: FieldValue.delete(),
      activeAttemptId: FieldValue.delete(),
    });

    return true;
  });
}

export async function retryPassageExtraction(params: {
  uid: string;
  recordId: string;
}) {
  const passageRef = getUserPassagesCollectionRef(params.uid).doc(
    params.recordId,
  );

  return getFirebaseAdminFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(passageRef);

    if (!snapshot.exists) {
      throw new Error("NOT_FOUND");
    }

    const data = snapshot.data() as PassageHistoryItem;
    const status = getPassageStatus(data);
    const now = Timestamp.now();

    if (status === "pending" && !isStalePendingPassage(data, now)) {
      throw new Error("RETRY_NOT_AVAILABLE");
    }

    if (status !== "pending" && status !== "error") {
      throw new Error("RETRY_NOT_AVAILABLE");
    }

    transaction.update(passageRef, {
      vocabularyList: [],
      vocabularyCount: 0,
      status: "pending",
      pendingSince: now,
      updatedAt: now,
      activeAttemptId: FieldValue.delete(),
      errorReason: FieldValue.delete(),
    });

    return {
      recordId: params.recordId,
      status: "pending" as const,
      pendingSince: now,
    };
  });
}

export async function saveParagraphTranslation(params: {
  uid: string;
  recordId: string;
  paragraphId: string;
  translation: string;
}) {
  const normalizedTranslation = params.translation.trim();

  if (!normalizedTranslation) {
    throw new Error("INVALID_INPUT");
  }

  const passageRef = getUserPassagesCollectionRef(params.uid).doc(
    params.recordId.trim(),
  );

  return getFirebaseAdminFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(passageRef);

    if (!snapshot.exists) {
      throw new Error("NOT_FOUND");
    }

    const data = snapshot.data() as PassageHistoryItem;
    const paragraphs = getPassageParagraphs(data, data.passage ?? "");
    const currentParagraph = findPassageParagraph(
      paragraphs,
      params.paragraphId,
    );
    const now = Timestamp.now();

    if (!currentParagraph) {
      throw new Error("PARAGRAPH_NOT_FOUND");
    }

    if (
      currentParagraph.translationState === "generating" &&
      !hasExpiredTranslationOperation(currentParagraph, now)
    ) {
      throw new Error("TRANSLATION_IN_PROGRESS");
    }

    const updatedParagraph = {
      ...withoutTranslationError(withoutTranslationOperation(currentParagraph)),
      translation: normalizedTranslation,
      translationState: "available" as const,
      translationUpdatedAt: now,
    };
    const updatedParagraphs = paragraphs.map((paragraph) =>
      paragraph.paragraphId === params.paragraphId
        ? updatedParagraph
        : paragraph,
    );

    transaction.update(passageRef, {
      paragraphs: updatedParagraphs,
      updatedAt: now,
    });

    return toPassageParagraphDto(updatedParagraph);
  });
}

export async function deleteParagraphTranslation(params: {
  uid: string;
  recordId: string;
  paragraphId: string;
}) {
  const passageRef = getUserPassagesCollectionRef(params.uid).doc(
    params.recordId.trim(),
  );

  return getFirebaseAdminFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(passageRef);

    if (!snapshot.exists) {
      throw new Error("NOT_FOUND");
    }

    const data = snapshot.data() as PassageHistoryItem;
    const paragraphs = getPassageParagraphs(data, data.passage ?? "");
    const currentParagraph = findPassageParagraph(
      paragraphs,
      params.paragraphId,
    );
    const now = Timestamp.now();

    if (!currentParagraph) {
      throw new Error("PARAGRAPH_NOT_FOUND");
    }

    if (
      currentParagraph.translationState === "generating" &&
      !hasExpiredTranslationOperation(currentParagraph, now)
    ) {
      throw new Error("TRANSLATION_IN_PROGRESS");
    }

    const updatedParagraph = {
      ...withoutTranslationValue(
        withoutTranslationError(withoutTranslationOperation(currentParagraph)),
      ),
      translationState: "missing" as const,
    };
    const updatedParagraphs = paragraphs.map((paragraph) =>
      paragraph.paragraphId === params.paragraphId
        ? updatedParagraph
        : paragraph,
    );

    transaction.update(passageRef, {
      paragraphs: updatedParagraphs,
      updatedAt: now,
    });

    return toPassageParagraphDto(updatedParagraph);
  });
}

export async function claimParagraphTranslation(params: {
  uid: string;
  recordId: string;
  paragraphId: string;
}) {
  const operationId = randomUUID();
  const passageRef = getUserPassagesCollectionRef(params.uid).doc(
    params.recordId.trim(),
  );

  return getFirebaseAdminFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(passageRef);

    if (!snapshot.exists) {
      throw new Error("NOT_FOUND");
    }

    const data = snapshot.data() as PassageHistoryItem;
    const paragraphs = getPassageParagraphs(data, data.passage ?? "");
    const currentParagraph = findPassageParagraph(
      paragraphs,
      params.paragraphId,
    );
    const now = Timestamp.now();

    if (!currentParagraph) {
      throw new Error("PARAGRAPH_NOT_FOUND");
    }

    if (
      currentParagraph.translationState === "generating" &&
      !hasExpiredTranslationOperation(currentParagraph, now)
    ) {
      throw new Error("TRANSLATION_IN_PROGRESS");
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
      paragraph.paragraphId === params.paragraphId
        ? updatedParagraph
        : paragraph,
    );

    transaction.update(passageRef, {
      paragraphs: updatedParagraphs,
      updatedAt: now,
    });

    return {
      operationId,
      sourceText: currentParagraph.sourceText,
      ...(currentParagraph.translation
        ? { previousTranslation: currentParagraph.translation }
        : {}),
    };
  });
}

export async function completeParagraphTranslation(params: {
  uid: string;
  recordId: string;
  paragraphId: string;
  operationId: string;
  translation: string;
}) {
  const normalizedTranslation = params.translation.trim();

  if (!normalizedTranslation) {
    throw new Error("INVALID_INPUT");
  }

  const passageRef = getUserPassagesCollectionRef(params.uid).doc(
    params.recordId.trim(),
  );

  return getFirebaseAdminFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(passageRef);

    if (!snapshot.exists) {
      return false;
    }

    const data = snapshot.data() as PassageHistoryItem;
    const paragraphs = getPassageParagraphs(data, data.passage ?? "");
    const currentParagraph = findPassageParagraph(
      paragraphs,
      params.paragraphId,
    );

    if (
      !currentParagraph ||
      currentParagraph.translationOperationId !== params.operationId
    ) {
      return false;
    }

    const updatedParagraph = {
      ...withoutTranslationError(withoutTranslationOperation(currentParagraph)),
      translation: normalizedTranslation,
      translationState: "available" as const,
      translationUpdatedAt: Timestamp.now(),
    };
    const updatedParagraphs = paragraphs.map((paragraph) =>
      paragraph.paragraphId === params.paragraphId
        ? updatedParagraph
        : paragraph,
    );

    transaction.update(passageRef, {
      paragraphs: updatedParagraphs,
      updatedAt: Timestamp.now(),
    });

    return toPassageParagraphDto(updatedParagraph);
  });
}

export async function failParagraphTranslation(params: {
  uid: string;
  recordId: string;
  paragraphId: string;
  operationId: string;
  errorReason: string;
}) {
  const passageRef = getUserPassagesCollectionRef(params.uid).doc(
    params.recordId.trim(),
  );

  return getFirebaseAdminFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(passageRef);

    if (!snapshot.exists) {
      return false;
    }

    const data = snapshot.data() as PassageHistoryItem;
    const paragraphs = getPassageParagraphs(data, data.passage ?? "");
    const currentParagraph = findPassageParagraph(
      paragraphs,
      params.paragraphId,
    );

    if (
      !currentParagraph ||
      currentParagraph.translationOperationId !== params.operationId
    ) {
      return false;
    }

    const updatedParagraph = {
      ...withoutTranslationOperation(currentParagraph),
      translationState: "error" as const,
      translationError:
        params.errorReason.trim() || "Translation failed. Please retry.",
    };
    const updatedParagraphs = paragraphs.map((paragraph) =>
      paragraph.paragraphId === params.paragraphId
        ? updatedParagraph
        : paragraph,
    );

    transaction.update(passageRef, {
      paragraphs: updatedParagraphs,
      updatedAt: Timestamp.now(),
    });

    return toPassageParagraphDto(updatedParagraph);
  });
}

export async function reclaimExpiredParagraphTranslation(params: {
  uid: string;
  recordId: string;
  paragraphId: string;
}) {
  const passageRef = getUserPassagesCollectionRef(params.uid).doc(
    params.recordId.trim(),
  );

  return getFirebaseAdminFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(passageRef);

    if (!snapshot.exists) {
      return false;
    }

    const data = snapshot.data() as PassageHistoryItem;
    const paragraphs = getPassageParagraphs(data, data.passage ?? "");
    const currentParagraph = findPassageParagraph(
      paragraphs,
      params.paragraphId,
    );
    const now = Timestamp.now();

    if (
      !currentParagraph ||
      !hasExpiredTranslationOperation(currentParagraph, now)
    ) {
      return false;
    }

    const updatedParagraph = {
      ...withoutTranslationOperation(currentParagraph),
      translationState: "error" as const,
      translationError: "Translation request expired. Please retry.",
    };
    const updatedParagraphs = paragraphs.map((paragraph) =>
      paragraph.paragraphId === params.paragraphId
        ? updatedParagraph
        : paragraph,
    );

    transaction.update(passageRef, {
      paragraphs: updatedParagraphs,
      updatedAt: now,
    });

    return true;
  });
}

export async function upsertVocabularyItems(params: {
  uid: string;
  extractionId: string;
  vocabulary: VocabularyItemInput[];
  createdAt?: Timestamp;
}) {
  const now = params.createdAt ?? Timestamp.now();
  const combinedItems = new Map<
    string,
    {
      word: string;
      definition: string;
      vietnamese: string;
      count: number;
    }
  >();

  for (const item of params.vocabulary) {
    const normalizedWord = normalizeWord(item.word);

    if (!normalizedWord) {
      continue;
    }

    const existing = combinedItems.get(normalizedWord);

    if (existing) {
      existing.count += 1;
      continue;
    }

    combinedItems.set(normalizedWord, {
      word: item.word.trim(),
      definition: item.definition.trim(),
      vietnamese: item.vietnamese.trim(),
      count: 1,
    });
  }

  if (!combinedItems.size) {
    return { createdCount: 0, updatedCount: 0 };
  }

  const vocabularyRef = getUserVocabularyCollectionRef(params.uid);
  const userRef = getUserDocRef(params.uid);

  let createdCount = 0;
  let updatedCount = 0;

  await getFirebaseAdminFirestore().runTransaction(async (transaction) => {
    const existingVocabularyByWord = new Map<
      string,
      StoredVocabularyItem | undefined
    >();

    for (const [normalizedWord] of combinedItems.entries()) {
      const vocabularyId = toVocabularyId(normalizedWord);
      const docRef = vocabularyRef.doc(vocabularyId);
      const existingSnapshot = await transaction.get(docRef);
      existingVocabularyByWord.set(
        normalizedWord,
        existingSnapshot.data() as StoredVocabularyItem | undefined,
      );
    }

    for (const [normalizedWord, item] of combinedItems.entries()) {
      const vocabularyId = toVocabularyId(normalizedWord);
      const docRef = vocabularyRef.doc(vocabularyId);
      const existingData = existingVocabularyByWord.get(normalizedWord) as
        | StoredVocabularyItem
        | undefined;

      if (!existingData) {
        transaction.set(docRef, {
          vocabularyId,
          uid: params.uid,
          word: item.word,
          normalizedWord,
          definition: item.definition,
          vietnamese: item.vietnamese,
          firstSeenAt: now,
          lastSeenAt: now,
          occurrenceCount: item.count,
          passageRefs: [params.extractionId],
        } satisfies StoredVocabularyItem);
        createdCount += 1;
        continue;
      }

      transaction.set(
        docRef,
        {
          word: item.word,
          definition: item.definition,
          vietnamese: item.vietnamese,
          lastSeenAt: now,
          occurrenceCount: existingData.occurrenceCount + item.count,
          passageRefs: Array.from(
            new Set([...(existingData.passageRefs ?? []), params.extractionId]),
          ),
        },
        { merge: true },
      );
      updatedCount += 1;
    }

    if (createdCount > 0) {
      transaction.set(
        userRef,
        {
          uid: params.uid,
          totalVocabularySaved: FieldValue.increment(createdCount),
          updatedAt: now,
        },
        { merge: true },
      );
    }
  });

  return { createdCount, updatedCount };
}

function applyVocabularyCursor(
  baseQuery: Query,
  cursor: string | null | undefined,
  hasQueryFilter: boolean,
) {
  if (!cursor) {
    return baseQuery;
  }

  const decoded = decodeCursor(cursor);

  if (hasQueryFilter) {
    const normalizedWord = decoded.normalizedWord;
    const id = decoded.id;

    if (typeof normalizedWord !== "string" || typeof id !== "string") {
      throw new Error("INVALID_CURSOR");
    }

    return baseQuery.startAfter(normalizedWord, id);
  }

  const ts = decoded.ts;
  const id = decoded.id;

  if (typeof ts !== "number" || typeof id !== "string") {
    throw new Error("INVALID_CURSOR");
  }

  return baseQuery.startAfter(Timestamp.fromMillis(ts), id);
}

export async function listVocabularyCollection(params: {
  uid: string;
  limit?: number;
  cursor?: string | null;
  q?: string | null;
}) {
  const limit = safeLimit(
    params.limit,
    defaultVocabularyLimit,
    maxVocabularyLimit,
  );
  const normalizedQuery = params.q?.trim().toLowerCase();

  let query: Query = getUserVocabularyCollectionRef(params.uid);

  if (normalizedQuery) {
    query = query
      .where("normalizedWord", ">=", normalizedQuery)
      .where("normalizedWord", "<=", `${normalizedQuery}\uf8ff`)
      .orderBy("normalizedWord", "asc")
      .orderBy("__name__", "asc");
  } else {
    query = query.orderBy("lastSeenAt", "desc").orderBy("__name__", "desc");
  }

  query = applyVocabularyCursor(query, params.cursor, Boolean(normalizedQuery));

  const snapshot = await query.limit(limit).get();

  const items = snapshot.docs.map((doc) => {
    const data = doc.data() as StoredVocabularyItem;

    return {
      vocabularyId: data.vocabularyId ?? doc.id,
      word: data.word,
      definition: data.definition,
      vietnamese:
        data.vietnamese ??
        (data as { contextSnippet?: string }).contextSnippet ??
        "",
      firstSeenAt: toDateIsoString(data.firstSeenAt),
      lastSeenAt: toDateIsoString(data.lastSeenAt),
      occurrenceCount: data.occurrenceCount,
    } satisfies VocabularyApiItem;
  });

  const lastDoc = snapshot.docs.at(-1);
  let nextCursor: string | null = null;

  if (lastDoc && snapshot.docs.length === limit) {
    const data = lastDoc.data() as StoredVocabularyItem;
    nextCursor = normalizedQuery
      ? encodeCursor({ normalizedWord: data.normalizedWord, id: lastDoc.id })
      : encodeCursor({
          ts: (data.lastSeenAt ?? Timestamp.now()).toMillis(),
          id: lastDoc.id,
        });
  }

  return {
    uid: params.uid,
    items,
    nextCursor,
  };
}

function applyPassageCursor(
  baseQuery: Query,
  cursor: string | null | undefined,
) {
  if (!cursor) {
    return baseQuery;
  }

  const decoded = decodeCursor(cursor);
  const ts = decoded.ts;
  const id = decoded.id;

  if (typeof ts !== "number" || typeof id !== "string") {
    throw new Error("INVALID_CURSOR");
  }

  return baseQuery.startAfter(Timestamp.fromMillis(ts), id);
}

export async function getProfileHistory(params: {
  uid: string;
  passagesLimit?: number;
  vocabularyLimit?: number;
  passagesCursor?: string | null;
  vocabularyCursor?: string | null;
}) {
  const passagesLimit = safeLimit(
    params.passagesLimit,
    defaultHistoryLimit,
    maxHistoryLimit,
  );
  const vocabularyLimit = safeLimit(
    params.vocabularyLimit,
    defaultHistoryLimit,
    maxHistoryLimit,
  );

  let passagesQuery: Query = getUserPassagesCollectionRef(params.uid)
    .orderBy("createdAt", "desc")
    .orderBy("__name__", "desc");
  passagesQuery = applyPassageCursor(passagesQuery, params.passagesCursor);

  const passagesSnapshot = await passagesQuery.limit(passagesLimit).get();
  const passages = passagesSnapshot.docs.map((doc) => {
    const data = doc.data() as PassageHistoryItem;
    const passage = data.passage ?? "";
    const status = getPassageStatus(data);
    const vocabularyList = getPassageVocabularyList(data);

    return {
      recordId: data.recordId ?? doc.id,
      title: resolvePassageTitle(data.title, passage),
      previewText: data.previewText ?? buildPassagePreview(passage),
      createdAt: toDateIsoString(data.createdAt),
      vocabularyCount: getPassageVocabularyCount(status, vocabularyList),
      status,
      ...(status === "error" && data.errorReason
        ? { errorReason: data.errorReason }
        : {}),
    } satisfies PassageApiItem;
  });

  let vocabularyQuery: Query = getUserVocabularyCollectionRef(params.uid)
    .orderBy("lastSeenAt", "desc")
    .orderBy("__name__", "desc");
  vocabularyQuery = applyVocabularyCursor(
    vocabularyQuery,
    params.vocabularyCursor,
    false,
  );

  const vocabularySnapshot = await vocabularyQuery.limit(vocabularyLimit).get();
  const vocabulary = vocabularySnapshot.docs.map((doc) => {
    const data = doc.data() as StoredVocabularyItem;

    return {
      vocabularyId: data.vocabularyId ?? doc.id,
      word: data.word,
      definition: data.definition,
      lastSeenAt: toDateIsoString(data.lastSeenAt),
      occurrenceCount: data.occurrenceCount,
    };
  });

  const lastPassageDoc = passagesSnapshot.docs.at(-1);
  const lastVocabularyDoc = vocabularySnapshot.docs.at(-1);

  return {
    uid: params.uid,
    passages,
    vocabulary,
    next: {
      passagesCursor:
        lastPassageDoc && passagesSnapshot.docs.length === passagesLimit
          ? encodeCursor({
              ts: (
                (lastPassageDoc.data() as PassageHistoryItem).createdAt ??
                Timestamp.now()
              ).toMillis(),
              id: lastPassageDoc.id,
            })
          : null,
      vocabularyCursor:
        lastVocabularyDoc && vocabularySnapshot.docs.length === vocabularyLimit
          ? encodeCursor({
              ts: (
                (lastVocabularyDoc.data() as StoredVocabularyItem).lastSeenAt ??
                Timestamp.now()
              ).toMillis(),
              id: lastVocabularyDoc.id,
            })
          : null,
    },
  };
}

export async function getPassageDetailByRecordId(params: {
  uid: string;
  recordId: string;
}) {
  const normalizedRecordId = params.recordId.trim();

  if (!normalizedRecordId) {
    return null;
  }

  const snapshot = await getUserPassagesCollectionRef(params.uid)
    .doc(normalizedRecordId)
    .get();

  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() as PassageHistoryItem;
  const passage = data.passage ?? "";
  const status = getPassageStatus(data);
  const vocabularyList = getPassageVocabularyList(data);
  const paragraphs = getPassageParagraphs(data, passage);
  const pendingSince = getPendingSince(data);

  const shouldUpdateParagraphs =
    !Array.isArray(data.paragraphs) ||
    (Array.isArray(data.paragraphs) &&
      data.paragraphs.length !== paragraphs.length);

  if (shouldUpdateParagraphs) {
    await snapshot.ref.update({
      paragraphs,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  return {
    recordId: data.recordId ?? snapshot.id,
    title: resolvePassageTitle(data.title, passage),
    passage,
    paragraphs: paragraphs.map(toPassageParagraphDto),
    vocabularyList: status === "completed" ? vocabularyList : [],
    createdAt: toDateIsoString(data.createdAt),
    vocabularyCount: getPassageVocabularyCount(status, vocabularyList),
    status,
    ...(status === "pending" && pendingSince
      ? { pendingSince: pendingSince.toDate().toISOString() }
      : {}),
    ...(status === "error" && data.errorReason
      ? { errorReason: data.errorReason }
      : {}),
  } satisfies PassageDetailApiItem;
}

export async function addVocabularyToPassage(params: {
  uid: string;
  recordId: string;
  vocabulary: VocabularyItemInput;
}) {
  const normalizedRecordId = params.recordId.trim();

  if (!normalizedRecordId) {
    throw new Error("INVALID_INPUT");
  }

  const passageRef = getUserPassagesCollectionRef(params.uid).doc(
    normalizedRecordId,
  );
  const snapshot = await passageRef.get();

  if (!snapshot.exists) {
    throw new Error("NOT_FOUND");
  }

  const data = snapshot.data() as PassageHistoryItem;
  const currentVocabularyList = data.vocabularyList ?? [];
  const normalizedVocabulary = normalizeVocabularyItem(params.vocabulary);

  if (!normalizedVocabulary.word || !normalizedVocabulary.definition) {
    throw new Error("INVALID_INPUT");
  }

  // Add the new vocabulary item at the beginning of the list
  const updatedVocabularyList = [
    normalizedVocabulary,
    ...currentVocabularyList,
  ];

  // Update the passage with the new vocabulary list
  await passageRef.update({
    vocabularyList: updatedVocabularyList,
    vocabularyCount: updatedVocabularyList.length,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Return the normalized vocabulary item for the response
  return {
    ...normalizedVocabulary,
  } satisfies VocabularyItemInput;
}

export async function updateVocabularyInPassage(params: {
  uid: string;
  recordId: string;
  index: number;
  vocabulary: VocabularyItemInput;
}) {
  const normalizedRecordId = params.recordId.trim();

  if (
    !normalizedRecordId ||
    !Number.isInteger(params.index) ||
    params.index < 0
  ) {
    throw new Error("INVALID_INPUT");
  }

  const normalizedVocabulary = normalizeVocabularyItem(params.vocabulary);

  if (!normalizedVocabulary.word || !normalizedVocabulary.definition) {
    throw new Error("INVALID_INPUT");
  }

  const passageRef = getUserPassagesCollectionRef(params.uid).doc(
    normalizedRecordId,
  );
  const snapshot = await passageRef.get();

  if (!snapshot.exists) {
    throw new Error("NOT_FOUND");
  }

  const data = snapshot.data() as PassageHistoryItem;
  const currentVocabularyList = data.vocabularyList ?? [];

  if (params.index >= currentVocabularyList.length) {
    throw new Error("ITEM_NOT_FOUND");
  }

  const updatedVocabularyList = [...currentVocabularyList];
  updatedVocabularyList[params.index] = normalizedVocabulary;

  await passageRef.update({
    vocabularyList: updatedVocabularyList,
    vocabularyCount: updatedVocabularyList.length,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {
    ...normalizedVocabulary,
  } satisfies VocabularyItemInput;
}

export async function deleteVocabularyFromPassage(params: {
  uid: string;
  recordId: string;
  index: number;
}) {
  const normalizedRecordId = params.recordId.trim();

  if (
    !normalizedRecordId ||
    !Number.isInteger(params.index) ||
    params.index < 0
  ) {
    throw new Error("INVALID_INPUT");
  }

  const passageRef = getUserPassagesCollectionRef(params.uid).doc(
    normalizedRecordId,
  );
  const snapshot = await passageRef.get();

  if (!snapshot.exists) {
    throw new Error("NOT_FOUND");
  }

  const data = snapshot.data() as PassageHistoryItem;
  const currentVocabularyList = data.vocabularyList ?? [];

  if (params.index >= currentVocabularyList.length) {
    throw new Error("ITEM_NOT_FOUND");
  }

  const removedItem = currentVocabularyList[params.index];
  const updatedVocabularyList = currentVocabularyList.filter(
    (_, index) => index !== params.index,
  );

  await passageRef.update({
    vocabularyList: updatedVocabularyList,
    vocabularyCount: updatedVocabularyList.length,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {
    ...normalizeVocabularyItem(removedItem),
  } satisfies VocabularyItemInput;
}

export async function deletePassageHistoryByRecordId(params: {
  uid: string;
  recordId: string;
}) {
  const normalizedRecordId = params.recordId.trim();

  if (!normalizedRecordId) {
    throw new Error("INVALID_INPUT");
  }

  const passageRef = getUserPassagesCollectionRef(params.uid).doc(
    normalizedRecordId,
  );
  const userRef = getUserDocRef(params.uid);
  const vocabularyRef = getUserVocabularyCollectionRef(params.uid);

  await getFirebaseAdminFirestore().runTransaction(async (transaction) => {
    const passageSnapshot = await transaction.get(passageRef);

    if (!passageSnapshot.exists) {
      throw new Error("NOT_FOUND");
    }

    const userSnapshot = await transaction.get(userRef);
    const userData = userSnapshot.data() as LearnerProfile | undefined;
    const currentTotalPassages = userData?.totalPassages ?? 0;
    const currentTotalVocabularySaved = userData?.totalVocabularySaved ?? 0;
    const passageData = passageSnapshot.data() as PassageHistoryItem;
    const vocabularyList = passageData.vocabularyList ?? [];
    const wordCountByVocabularyId = new Map<string, number>();

    for (const item of vocabularyList) {
      const normalizedWord = normalizeWord(item.word);

      if (!normalizedWord) {
        continue;
      }

      const vocabularyId = toVocabularyId(normalizedWord);
      const previousCount = wordCountByVocabularyId.get(vocabularyId) ?? 0;
      wordCountByVocabularyId.set(vocabularyId, previousCount + 1);
    }

    const vocabularySnapshots = await Promise.all(
      Array.from(wordCountByVocabularyId.keys()).map(async (vocabularyId) => {
        const vocabularyDocRef = vocabularyRef.doc(vocabularyId);
        const vocabularySnapshot = await transaction.get(vocabularyDocRef);

        return {
          vocabularyId,
          vocabularyDocRef,
          vocabularySnapshot,
        };
      }),
    );

    let deletedVocabularyCount = 0;

    for (const {
      vocabularyId,
      vocabularyDocRef,
      vocabularySnapshot,
    } of vocabularySnapshots) {
      if (!vocabularySnapshot.exists) {
        continue;
      }

      const occurrenceCountInPassage =
        wordCountByVocabularyId.get(vocabularyId) ?? 0;
      const vocabularyData = vocabularySnapshot.data() as StoredVocabularyItem;
      const currentPassageRefs = vocabularyData.passageRefs ?? [];
      const isLinkedToPassage = currentPassageRefs.includes(normalizedRecordId);

      if (!isLinkedToPassage) {
        continue;
      }

      const nextPassageRefs = currentPassageRefs.filter(
        (recordId) => recordId !== normalizedRecordId,
      );
      const nextOccurrenceCount = Math.max(
        (vocabularyData.occurrenceCount ?? 0) - occurrenceCountInPassage,
        0,
      );

      if (!nextPassageRefs.length || nextOccurrenceCount === 0) {
        transaction.delete(vocabularyDocRef);
        deletedVocabularyCount += 1;
        continue;
      }

      transaction.set(
        vocabularyDocRef,
        {
          occurrenceCount: nextOccurrenceCount,
          passageRefs: nextPassageRefs,
        },
        { merge: true },
      );
    }

    transaction.delete(passageRef);
    transaction.set(
      userRef,
      {
        uid: params.uid,
        totalPassages: Math.max(currentTotalPassages - 1, 0),
        totalVocabularySaved: Math.max(
          currentTotalVocabularySaved - deletedVocabularyCount,
          0,
        ),
        updatedAt: Timestamp.now(),
      },
      { merge: true },
    );
  });

  return {
    recordId: normalizedRecordId,
  };
}
