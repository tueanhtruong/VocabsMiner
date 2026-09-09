import { apiError, apiOk } from "@/lib/api/http";
import { getAuthenticatedUserFromAuthorizationHeader } from "@/lib/auth/session";

type DictionaryPhonetic = {
  text?: unknown;
  audio?: unknown;
};

const emptyPronunciation = {
  phonetic: null,
  audioUrl: null,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeAudioUrl(url: string) {
  return url.startsWith("//") ? `https:${url}` : url;
}

function parsePronunciation(data: unknown) {
  const entry = Array.isArray(data) && isRecord(data[0]) ? data[0] : null;

  if (!entry) {
    return emptyPronunciation;
  }

  const phoneticEntries = Array.isArray(entry.phonetics)
    ? entry.phonetics.filter(isRecord)
    : [];
  const phoneticEntry = phoneticEntries as DictionaryPhonetic[];
  const audioEntry = phoneticEntry.find(
    (item) => typeof item.audio === "string" && item.audio,
  );
  const textEntry = phoneticEntry.find(
    (item) => typeof item.text === "string" && item.text,
  );
  const phonetic =
    typeof entry.phonetic === "string" && entry.phonetic
      ? entry.phonetic
      : typeof textEntry?.text === "string"
        ? textEntry.text
        : null;
  const audioUrl =
    typeof audioEntry?.audio === "string"
      ? normalizeAudioUrl(audioEntry.audio)
      : null;

  return { phonetic, audioUrl };
}

export async function GET(request: Request) {
  const authenticatedUser = await getAuthenticatedUserFromAuthorizationHeader();

  if (!authenticatedUser) {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }

  const word = new URL(request.url).searchParams.get("word")?.trim() ?? "";

  if (!word || word.length > 100) {
    return apiError("INVALID_INPUT", "A valid word is required", 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`,
      {
        cache: "no-store",
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      return apiOk({ pronunciation: emptyPronunciation });
    }

    return apiOk({ pronunciation: parsePronunciation(await response.json()) });
  } catch {
    return apiOk({ pronunciation: emptyPronunciation });
  } finally {
    clearTimeout(timeout);
  }
}
