import { translate } from "@vitalets/google-translate-api";

import type {
  SelectedWordActionInput,
  TranslationActionResponse,
} from "@/lib/word-actions/types";

export async function translateSelectedWordToVietnamese(
  input: SelectedWordActionInput,
): Promise<TranslationActionResponse> {
  const result = await translate(input.selectedWord, { to: "vi" });
  const vietnamese = result.text.trim();

  if (!vietnamese) {
    throw new Error("TRANSLATION_EMPTY");
  }

  return {
    selectedWord: input.selectedWord,
    vietnamese,
  };
}
