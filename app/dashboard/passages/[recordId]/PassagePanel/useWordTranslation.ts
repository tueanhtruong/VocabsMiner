import { useEffect, useState } from "react";

import { requestJson } from "@/lib/query-hooks/api-client";

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
        const response = await requestJson<{ vietnamese: string }>(
          "/api/word-actions/translate",
          {
            method: "POST",
            signal: controller.signal,
            body: JSON.stringify({ selectedWord: word }),
          },
        );

        if (!response.vietnamese.trim()) {
          throw new Error("Translation returned no text.");
        }

        setState({
          word,
          translation: response.vietnamese,
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
