"use client";

import { useState } from "react";

import type { PassageParagraph } from "@/lib/query-hooks/translations";

type ParagraphTranslationProps = {
  paragraph: PassageParagraph;
  onSave: (translation: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onGenerate: () => Promise<void>;
  onRegenerate: () => Promise<void>;
};

export function ParagraphTranslation({
  paragraph,
  onSave,
  onDelete,
  onGenerate,
  onRegenerate,
}: ParagraphTranslationProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(paragraph.translation ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const translationPanelId = `${paragraph.paragraphId}-translation`;
  const hasTranslation = Boolean(paragraph.translation);

  const beginEditing = () => {
    setDraft(paragraph.translation ?? "");
    setErrorMessage(null);
    setIsEditing(true);
    setIsExpanded(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await onSave(draft);
      setIsEditing(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save translation.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this paragraph translation?")) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await onDelete();
      setIsEditing(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete translation.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      await onGenerate();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to generate translation.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      await onRegenerate();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to regenerate translation.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mt-3 border-l-2 border-emerald-200 pl-3">
      <button
        type="button"
        aria-controls={translationPanelId}
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((expanded) => !expanded)}
        className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-900"
      >
        {isExpanded ? "Hide Translation" : "Show Translation"}
      </button>

      {isExpanded ? (
        <div
          id={translationPanelId}
          className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm leading-7 text-emerald-950"
        >
          {isEditing ? (
            <div>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={4}
                className="w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                aria-label={`Vietnamese translation for paragraph ${paragraph.index + 1}`}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={isSaving || isDeleting || isGenerating}
                  className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(paragraph.translation ?? "");
                    setErrorMessage(null);
                    setIsEditing(false);
                  }}
                  disabled={isSaving || isDeleting || isGenerating}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : hasTranslation ? (
            <p>{paragraph.translation}</p>
          ) : paragraph.translationState === "generating" ? (
            <p>Translation is being generated...</p>
          ) : paragraph.translationState === "error" ? (
            <p>
              {paragraph.translationError ??
                "Translation is unavailable. Please try again."}
            </p>
          ) : (
            <p>Translation has not been added yet.</p>
          )}
          {errorMessage ? (
            <p className="mt-2 text-sm font-medium text-red-700">
              {errorMessage}
            </p>
          ) : null}
        </div>
      ) : null}

      {isExpanded && !isEditing ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {hasTranslation ? (
            <>
              <button
                type="button"
                onClick={beginEditing}
                className="text-xs font-semibold text-gray-600 underline-offset-2 hover:text-gray-900 hover:underline"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isDeleting || isSaving || isGenerating}
                className="text-xs font-semibold text-red-700 underline-offset-2 hover:text-red-900 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
              <button
                type="button"
                onClick={() => void handleRegenerate()}
                disabled={isDeleting || isSaving || isGenerating}
                className="text-xs font-semibold text-emerald-700 underline-offset-2 hover:text-emerald-900 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGenerating ? "Regenerating..." : "Regenerate"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={beginEditing}
                disabled={isGenerating}
                className="text-xs font-semibold text-emerald-700 underline-offset-2 hover:text-emerald-900 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
              >
                Add Translation
              </button>
              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={isGenerating}
                className="text-xs font-semibold text-emerald-700 underline-offset-2 hover:text-emerald-900 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGenerating ? "Generating..." : "Generate with AI"}
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
