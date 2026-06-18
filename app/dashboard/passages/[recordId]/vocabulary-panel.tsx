"use client";

import { useState } from "react";

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
  onAddVocabulary?: (vocabulary: FormData) => Promise<void>;
  onUpdateVocabulary?: (index: number, vocabulary: FormData) => Promise<void>;
  onDeleteVocabulary?: (index: number) => Promise<void>;
};

type FormData = {
  word: string;
  type: string;
  phonetic: string;
  definition: string;
  vietnamese: string;
};

export function VocabularyPanel({
  vocabularyList,
  selectedWord,
  onSelectWord,
  onAddVocabulary,
  onUpdateVocabulary,
  onDeleteVocabulary,
}: VocabularyPanelProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    index: number;
    word: string;
  } | null>(null);
  const [formData, setFormData] = useState<FormData>({
    word: "",
    type: "",
    phonetic: "",
    definition: "",
    vietnamese: "",
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
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
    const newErrors: Partial<FormData> = {};

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
    if (errors[name as keyof FormData]) {
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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
                        <p className="mt-1 text-xs tracking-wide text-gray-500">
                          {item.type}{" "}
                          {item.phonetic ? `⎻⎻⎻ ${item.phonetic}` : ""}
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          {item.definition}
                        </p>
                        {item.vietnamese ? (
                          <p className="mt-2 text-xs text-gray-500">
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
                            className="h-4 w-4"
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
                            className="h-4 w-4"
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

      {/* Add Vocabulary Dialog */}
      <div
        className={`fixed inset-0 z-50 ${
          isDialogOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!isDialogOpen}
      >
        <button
          type="button"
          aria-label="Close add vocabulary dialog"
          onClick={closeFormDialog}
          className={`absolute inset-0 bg-black/40 transition-opacity ${
            isDialogOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-lg transition-opacity ${
              isDialogOpen ? "opacity-100" : "opacity-0"
            }`}
            role="dialog"
            aria-modal="true"
            aria-label="Add vocabulary dialog"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              {editingIndex === null ? "Add New Vocabulary" : "Edit Vocabulary"}
            </h3>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Word Field */}
              <div>
                <label
                  htmlFor="word"
                  className="block text-sm font-medium text-gray-700"
                >
                  Word <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="word"
                  name="word"
                  value={formData.word}
                  onChange={handleInputChange}
                  placeholder="e.g., serendipity"
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm transition focus:outline-none focus:ring-2 ${
                    errors.word
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-indigo-500"
                  }`}
                />
                {errors.word && (
                  <p className="mt-1 text-xs text-red-500">{errors.word}</p>
                )}
              </div>

              {/* Type Field */}
              <div>
                <label
                  htmlFor="type"
                  className="block text-sm font-medium text-gray-700"
                >
                  Type
                </label>
                <input
                  type="text"
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  placeholder="e.g., noun"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Phonetic Field */}
              <div>
                <label
                  htmlFor="phonetic"
                  className="block text-sm font-medium text-gray-700"
                >
                  Phonetic
                </label>
                <input
                  type="text"
                  id="phonetic"
                  name="phonetic"
                  value={formData.phonetic}
                  onChange={handleInputChange}
                  placeholder="e.g., /ˌserənˈdɪpɪti/"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Definition Field */}
              <div>
                <label
                  htmlFor="definition"
                  className="block text-sm font-medium text-gray-700"
                >
                  Definition <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="definition"
                  name="definition"
                  value={formData.definition}
                  onChange={handleInputChange}
                  placeholder="Enter the definition..."
                  rows={3}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm transition focus:outline-none focus:ring-2 ${
                    errors.definition
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-indigo-500"
                  }`}
                />
                {errors.definition && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.definition}
                  </p>
                )}
              </div>

              {/* Vietnamese Field */}
              <div>
                <label
                  htmlFor="vietnamese"
                  className="block text-sm font-medium text-gray-700"
                >
                  Vietnamese <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="vietnamese"
                  name="vietnamese"
                  value={formData.vietnamese}
                  onChange={handleInputChange}
                  placeholder="Enter concise Vietnamese translation..."
                  rows={2}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm transition focus:outline-none focus:ring-2 ${
                    errors.vietnamese
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-indigo-500"
                  }`}
                />
                {errors.vietnamese && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.vietnamese}
                  </p>
                )}
              </div>

              {/* Form Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={closeFormDialog}
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting
                    ? editingIndex === null
                      ? "Adding..."
                      : "Saving..."
                    : editingIndex === null
                      ? "Add Vocabulary"
                      : "Save Changes"}
                </button>
              </div>

              {formError ? (
                <p className="text-sm text-red-600">{formError}</p>
              ) : null}
            </form>
          </div>
        </div>
      </div>

      {/* Delete Vocabulary Dialog */}
      <div
        className={`fixed inset-0 z-60 ${
          deleteTarget ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!deleteTarget}
      >
        <button
          type="button"
          aria-label="Close delete vocabulary dialog"
          onClick={() => {
            if (isDeleting) {
              return;
            }

            setDeleteTarget(null);
            setDeleteError(null);
          }}
          className={`absolute inset-0 bg-black/40 transition-opacity ${
            deleteTarget ? "opacity-100" : "opacity-0"
          }`}
        />

        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-lg transition-opacity ${
              deleteTarget ? "opacity-100" : "opacity-0"
            }`}
            role="dialog"
            aria-modal="true"
            aria-label="Delete vocabulary confirmation dialog"
          >
            <h3 className="text-base font-semibold text-gray-900">
              Delete vocabulary?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              This will remove{" "}
              <span className="font-medium text-gray-900">
                {deleteTarget?.word}
              </span>{" "}
              from this passage.
            </p>

            {deleteError ? (
              <p className="mt-3 text-sm text-red-600">{deleteError}</p>
            ) : null}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError(null);
                }}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
