import { useCallback, useEffect, useRef } from "react";

import { requestJson } from "@/lib/query-hooks/api-client";

export type WordPronunciation = {
  phonetic: string | null;
  audioUrl: string | null;
};

const EMPTY_PRONUNCIATION: WordPronunciation = {
  phonetic: null,
  audioUrl: null,
};

// Module-level cache so repeated lookups (e.g. the same word in multiple
// places) don't hit the network more than once per session.
const pronunciationCache = new Map<string, WordPronunciation>();

// The voice list can load asynchronously, so resolve once it's populated.
function getVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.resolve([]);
  }

  const existing = window.speechSynthesis.getVoices();
  if (existing.length > 0) {
    return Promise.resolve(existing);
  }

  return new Promise((resolve) => {
    const handleVoicesChanged = () => {
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        handleVoicesChanged,
      );
      resolve(window.speechSynthesis.getVoices());
    };

    window.speechSynthesis.addEventListener(
      "voiceschanged",
      handleVoicesChanged,
    );
  });
}

// Quality generally ranks: Google > Microsoft Natural/Online > Apple > generic
// local voices. Pick the clearest available voice for the requested language.
async function getBestVoice(
  lang = "en-US",
): Promise<SpeechSynthesisVoice | undefined> {
  const voices = await getVoices();

  const priorityPatterns = [
    /Microsoft.*Online.*\(Natural\)/i, // Edge "Natural" voices - very clear
    /Google US English/i,
    /Samantha/i, // good Apple voice
    /Microsoft Aria/i,
  ];

  for (const pattern of priorityPatterns) {
    const match = voices.find(
      (voice) =>
        pattern.test(voice.name) && voice.lang.startsWith(lang.slice(0, 2)),
    );
    if (match) {
      return match;
    }
  }

  // Fallback: any voice matching the language, then any English voice.
  return (
    voices.find((voice) => voice.lang === lang) ??
    voices.find((voice) => voice.lang.startsWith("en"))
  );
}

async function fetchPronunciation(word: string): Promise<WordPronunciation> {
  const key = word.trim().toLowerCase();

  if (!key) {
    return EMPTY_PRONUNCIATION;
  }

  const cached = pronunciationCache.get(key);
  if (cached) {
    return cached;
  }

  try {
    const url = new URL(
      "/api/word-actions/pronunciation",
      window.location.origin,
    );
    url.searchParams.set("word", key);

    const response = await requestJson<{ pronunciation: WordPronunciation }>(
      url.toString(),
    );

    const result = response.pronunciation;

    pronunciationCache.set(key, result);
    return result;
  } catch {
    return EMPTY_PRONUNCIATION;
  }
}

export function useSpeech() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      audioRef.current?.pause();
    };
  }, []);

  // Native Web Speech API fallback when the dictionary has no audio clip.
  const fallbackSpeak = useCallback(async (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      return;
    }

    const lang = "en-US";
    const voice = await getBestVoice(lang);

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) {
      utterance.voice = voice;
    }
    utterance.lang = lang;
    utterance.rate = 0.8; // slower = clearer articulation for vocab learning
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
  }, []);

  const speak = useCallback(
    async (word: string) => {
      const { audioUrl } = await fetchPronunciation(word);

      if (audioUrl) {
        audioRef.current?.pause();
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        try {
          await audio.play();
          return;
        } catch {
          // Autoplay blocked or load failed — fall back to synthesized speech.
        }
      }

      fallbackSpeak(word);
    },
    [fallbackSpeak],
  );

  const lookup = useCallback((word: string) => fetchPronunciation(word), []);

  return { speak, lookup };
}
