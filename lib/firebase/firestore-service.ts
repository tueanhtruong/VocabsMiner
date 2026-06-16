import "server-only";

import { createHash } from "node:crypto";

import { FieldValue, Timestamp, type Query } from "firebase-admin/firestore";

import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";

export type LearnerProfile = {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
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
  definition: string;
  context: string;
};

export type StoredVocabularyItem = {
  vocabularyId: string;
  uid: string;
  word: string;
  normalizedWord: string;
  definition: string;
  contextSnippet: string;
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
  vocabularyList: VocabularyItemInput[];
  previewText: string;
  passageHash: string;
  vocabularyCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type VocabularyApiItem = {
  vocabularyId: string;
  word: string;
  definition: string;
  context: string;
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
};

export type PassageDetailApiItem = {
  recordId: string;
  title: string;
  passage: string;
  vocabularyList: VocabularyItemInput[];
  createdAt: string;
};

const defaultVocabularyLimit = 20;
const maxVocabularyLimit = 100;

const defaultHistoryLimit = 20;
const maxHistoryLimit = 50;

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

function resolvePassageTitle(title: string | undefined, passage: string) {
  const normalized = title?.trim();

  if (normalized) {
    return normalized;
  }

  const fallback = buildPassagePreview(passage, 60);
  return fallback || "Untitled passage";
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
  photoURL?: string;
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
      photoURL: params.photoURL ?? existingProfile?.photoURL,
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
    photoUrl: data.photoURL ?? null,
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

  await getFirebaseAdminFirestore().runTransaction(async (transaction) => {
    transaction.set(
      passageRef,
      {
        recordId: params.extractionId,
        extractionId: params.extractionId,
        uid: params.uid,
        title: resolvedTitle,
        passage: params.passageText,
        vocabularyList: params.vocabulary,
        previewText: buildPassagePreview(params.passageText),
        passageHash: hashPassage(params.passageText),
        vocabularyCount: Math.max(params.vocabularyCount, 0),
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
      context: string;
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
      context: item.context.trim(),
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
          contextSnippet: item.context,
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
          contextSnippet: item.context,
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
      context: data.contextSnippet,
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

    return {
      recordId: data.recordId ?? doc.id,
      title: resolvePassageTitle(data.title, passage),
      previewText: data.previewText ?? buildPassagePreview(passage),
      createdAt: toDateIsoString(data.createdAt),
      vocabularyCount: data.vocabularyCount ?? 0,
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

  return {
    recordId: data.recordId ?? snapshot.id,
    title: resolvePassageTitle(data.title, passage),
    passage,
    vocabularyList: data.vocabularyList ?? [],
    createdAt: toDateIsoString(data.createdAt),
  } satisfies PassageDetailApiItem;
}
