"use client";

import { useEffect, useState } from "react";

import type { VocabularyDraft } from "@/lib/word-actions/types";
import {
  VocabularyFormDialog,
  type VocabularyFormData,
} from "./VocabularyFormDialog";
import { DeleteVocabularyDialog } from "./DeleteVocabularyDialog";

export type DetailVocabularyItem = {
  word: string;
  type: string;
  phonetic: string;
  definition: string;
  vietnamese: string;
};

type VocabularyPanelProps = {
  vocabularyList: DetailVocabularyItem[];
  selectedWord: string | null;
  onSelectWord: (word: string) => void;
  onAddVocabulary?: (vocabulary: VocabularyFormData) => Promise<void>;
  onUpdateVocabulary?: (
    index: number,
    vocabulary: VocabularyFormData,
  ) => Promise<void>;
  onDeleteVocabulary?: (index: number) => Promise<void>;
  draftSeed?: VocabularyDraft | null;
};

export function VocabularyPanel({
  vocabularyList,
  selectedWord,
  onSelectWord,
  onAddVocabulary,
  onUpdateVocabulary,
  onDeleteVocabulary,
  draftSeed,
}: VocabularyPanelProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    index: number;
    word: string;
  } | null>(null);
  const [formData, setFormData] = useState<VocabularyFormData>({
    word: "",
    type: "",
    phonetic: "",
    definition: "",
    vietnamese: "",
  });
  const [errors, setErrors] = useState<Partial<VocabularyFormData>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const resetForm = () => {
    setFormData({
      word: "",
      type: "",
      phonetic: "",
      definition: "",
      vietnamese: "",
    });
    setErrors({});
    setFormError(null);
    setEditingIndex(null);
  };

  const closeFormDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const validateForm = () => {
    const newErrors: Partial<VocabularyFormData> = {};

    if (!formData.word.trim()) {
      newErrors.word = "Word is required";
    }

    if (!formData.definition.trim()) {
      newErrors.definition = "Definition is required";
    }

    if (!formData.vietnamese.trim()) {
      newErrors.vietnamese = "Vietnamese translation is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof VocabularyFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }

    if (formError) {
      setFormError(null);
    }
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  useEffect(() => {
    if (!draftSeed) {
      return;
    }

    const draftTimer = window.setTimeout(() => {
      setEditingIndex(null);
      setIsDialogOpen(true);
      setErrors({});
      setFormError(null);
      setFormData((current) => ({
        word: current.word || draftSeed.word,
        type: current.type || draftSeed.type,
        phonetic: current.phonetic || draftSeed.phonetic,
        definition: current.definition || draftSeed.definition,
        vietnamese: current.vietnamese || draftSeed.vietnamese,
      }));
    }, 0);

    return () => window.clearTimeout(draftTimer);
  }, [draftSeed]);

  const handleOpenEditDialog = (item: DetailVocabularyItem, index: number) => {
    setEditingIndex(index);
    setFormData({
      word: item.word,
      type: item.type,
      phonetic: item.phonetic,
      definition: item.definition,
      vietnamese: item.vietnamese,
    });
    setErrors({});
    setFormError(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    // e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingIndex !== null && onUpdateVocabulary) {
        await onUpdateVocabulary(editingIndex, formData);
      } else if (onAddVocabulary) {
        await onAddVocabulary(formData);
      }

      // Reset form and close dialog
      closeFormDialog();
    } catch (error) {
      console.error("Failed to add vocabulary:", error);
      setFormError("Unable to save vocabulary. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !onDeleteVocabulary) {
      setDeleteTarget(null);
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await onDeleteVocabulary(deleteTarget.index);
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete vocabulary:", error);
      setDeleteError("Unable to delete this vocabulary. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <article className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Vocabulary</h2>
          <button
            type="button"
            onClick={handleOpenAddDialog}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            + Add
          </button>
        </div>

        {!vocabularyList.length ? (
          <p className="mt-3 text-sm text-gray-600">
            No vocabulary was extracted for this passage.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {vocabularyList.map((item, index) => {
              const isSelected = selectedWord === item.word;

              return (
                <li key={`${item.word}-${index}`}>
                  <div
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                      isSelected
                        ? "border-indigo-400 bg-indigo-50"
                        : "border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => onSelectWord(item.word)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="font-semibold text-gray-900">
                          {item.word}
                        </p>
                        <p className="mt-1 text-sm tracking-wide text-gray-500">
                          {item.type}{" "}
                          {item.phonetic ? `|  ${item.phonetic}` : ""}
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          {item.definition}
                        </p>
                        {item.vietnamese ? (
                          <p className="mt-2 text-sm text-gray-500">
                            {item.vietnamese}
                          </p>
                        ) : null}
                      </button>

                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => handleOpenEditDialog(item, index)}
                          aria-label={`Edit ${item.word}`}
                          className="rounded-md p-1.5 text-gray-500 transition hover:bg-indigo-100 hover:text-indigo-700"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-5 w-5"
                            aria-hidden="true"
                          >
                            <path d="M4 20h4l10-10-4-4L4 16v4z" />
                            <path d="M13 7l4 4" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError(null);
                            setDeleteTarget({ index, word: item.word });
                          }}
                          aria-label={`Delete ${item.word}`}
                          className="rounded-md p-1.5 text-gray-500 transition hover:bg-red-100 hover:text-red-700"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-5 w-5"
                            aria-hidden="true"
                          >
                            <path d="M4 7h16" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                            <path d="M6 7l1 12h10l1-12" />
                            <path d="M9 7V5h6v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </article>

      <VocabularyFormDialog
        open={isDialogOpen}
        editingIndex={editingIndex}
        formData={formData}
        errors={errors}
        formError={formError}
        isSubmitting={isSubmitting}
        onClose={closeFormDialog}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
      />

      <DeleteVocabularyDialog
        open={Boolean(deleteTarget)}
        word={deleteTarget?.word ?? null}
        isDeleting={isDeleting}
        deleteError={deleteError}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
