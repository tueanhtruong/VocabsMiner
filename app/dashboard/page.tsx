"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ExtractionResult } from "@/app/dashboard/extraction-result";
import { ExtractionStatus } from "@/app/dashboard/extraction-status";
import { VocabularyList } from "@/app/dashboard/vocabulary-list";
import { getUidFromLocalStore } from "@/lib/auth/google-auth";
import { ApiClientError } from "@/lib/query-hooks/api-client";
import {
  ExtractionVocabularyItem,
  useExtractVocabularyMutation,
} from "@/lib/query-hooks/extraction";

const maxPassageLength = 5000;

export default function DashboardPage() {
  const [passage, setPassage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [vocabulary, setVocabulary] = useState<ExtractionVocabularyItem[]>([]);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const extractionMutation = useExtractVocabularyMutation();

  useEffect(() => {
    if (!getUidFromLocalStore()) {
      router.replace("/login?next=/dashboard");
    }
  }, [router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!passage.trim()) {
      setErrorCode("INVALID_INPUT");
      setErrorMessage("Please enter a passage before extracting.");
      return;
    }

    setErrorCode(null);
    setErrorMessage(null);

    try {
      const response = await extractionMutation.mutateAsync(passage);
      setVocabulary(response.vocabulary ?? []);
      setIsSubmitted(true);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorCode(error.code);
        setErrorMessage(error.message);
      } else {
        setErrorCode("INTERNAL_ERROR");
        setErrorMessage("Extraction failed unexpectedly");
      }

      setVocabulary([]);
      setIsSubmitted(true);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          Dashboard
        </h1>
        <p className="text-gray-600">
          Paste a passage to extract academic vocabulary and save your history.
        </p>
      </header>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <form className="space-y-4" onSubmit={onSubmit}>
          <label
            htmlFor="passage"
            className="block text-sm font-semibold text-gray-900"
          >
            Reading passage
          </label>
          <textarea
            id="passage"
            value={passage}
            onChange={(event) => setPassage(event.target.value)}
            className="min-h-40 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
            placeholder="Paste an academic passage here"
            maxLength={maxPassageLength}
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-gray-500">
              {passage.length}/{maxPassageLength} characters
            </p>
            <button
              type="submit"
              disabled={extractionMutation.isPending}
              className="rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 active:scale-100"
            >
              {extractionMutation.isPending
                ? "Extracting..."
                : "Extract Vocabulary"}
            </button>
          </div>
        </form>
      </section>

      <ExtractionStatus
        errorCode={errorCode}
        fallbackMessage={errorMessage ?? undefined}
      />
      <ExtractionResult vocabulary={vocabulary} isSubmitted={isSubmitted} />
      <VocabularyList />
    </main>
  );
}
