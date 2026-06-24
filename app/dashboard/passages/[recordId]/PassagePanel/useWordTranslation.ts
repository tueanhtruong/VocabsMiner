import { useEffect, useState } from "react";

import { extractVietnameseText } from "./utils";

type UseWordTranslationResult = {
  translation: string | null;
  translationError: string | null;
  isTranslating: boolean;
};

type TranslationState = {
  word: string | null;
  translation: string | null;
  translationError: string | null;
  isTranslating: boolean;
};

// Isolates translation network state from the panel layout flow.
export function useWordTranslation(
  word: string | null,
): UseWordTranslationResult {
  const [state, setState] = useState<TranslationState>({
    word: null,
    translation: null,
    translationError: null,
    isTranslating: false,
  });

  useEffect(() => {
    if (!word) {
      return;
    }

    const controller = new AbortController();

    const runTranslation = async () => {
      setState({
        word,
        translation: null,
        translationError: null,
        isTranslating: true,
      });

      try {
        const url = new URL(
          "https://translate.googleapis.com/translate_a/single",
        );
        url.searchParams.set("client", "gtx");
        url.searchParams.set("sl", "auto");
        url.searchParams.set("tl", "vi");
        url.searchParams.set("dt", "t");
        url.searchParams.set("q", word);

        const response = await fetch(url.toString(), {
          method: "GET",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to translate.");
        }

        const payload = (await response.json()) as unknown;
        const vietnamese = extractVietnameseText(payload);

        if (!vietnamese) {
          throw new Error("Translation returned no text.");
        }

        setState({
          word,
          translation: vietnamese,
          translationError: null,
          isTranslating: false,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setState({
          word,
          translation: null,
          translationError:
            error instanceof Error ? error.message : "Unable to translate.",
          isTranslating: false,
        });
      }
    };

    void runTranslation();

    return () => {
      controller.abort();
    };
  }, [word]);

  return {
    translation: state.word === word ? state.translation : null,
    translationError: state.word === word ? state.translationError : null,
    isTranslating: state.word === word ? state.isTranslating : false,
  };
}
