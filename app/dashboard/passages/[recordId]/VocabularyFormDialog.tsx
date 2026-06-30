"use client";

import { Modal } from "@mantine/core";

export type VocabularyFormData = {
  word: string;
  type: string;
  phonetic: string;
  definition: string;
  vietnamese: string;
};

type VocabularyFormDialogProps = {
  open: boolean;
  editingIndex: number | null;
  formData: VocabularyFormData;
  errors: Partial<VocabularyFormData>;
  formError: string | null;
  isSubmitting: boolean;
  onClose: () => void;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onSubmit: () => void;
};

export function VocabularyFormDialog({
  open,
  editingIndex,
  formData,
  errors,
  formError,
  isSubmitting,
  onClose,
  onInputChange,
  onSubmit,
}: VocabularyFormDialogProps) {
  return (
    <Modal.Root
      opened={open}
      onClose={() => {
        if (!isSubmitting) {
          onClose();
        }
      }}
      size="28rem"
      centered
    >
      <Modal.Overlay />
      <Modal.Content aria-label="Add vocabulary dialog">
        <Modal.Header className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
          <h3 className="text-lg font-semibold text-gray-900">
            {editingIndex === null ? "Add New Vocabulary" : "Edit Vocabulary"}
          </h3>
          <Modal.CloseButton aria-label="Close dialog" />
        </Modal.Header>

        <Modal.Body className="px-6 py-4">
          <form className="space-y-4 mt-3">
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
                onChange={onInputChange}
                placeholder="e.g., serendipity"
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm transition focus:outline-none focus:ring-2 ${
                  errors.word
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-indigo-500"
                }`}
              />
              {errors.word && (
                <p className="mt-1 text-sm text-red-500">{errors.word}</p>
              )}
            </div>

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
                onChange={onInputChange}
                placeholder="e.g., noun"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

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
                onChange={onInputChange}
                placeholder="e.g., /\u02ccser\u0259n\u02c8d\u026ap\u026ati/"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

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
                onChange={onInputChange}
                placeholder="Enter the definition..."
                rows={3}
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm transition focus:outline-none focus:ring-2 ${
                  errors.definition
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-indigo-500"
                }`}
              />
              {errors.definition && (
                <p className="mt-1 text-sm text-red-500">{errors.definition}</p>
              )}
            </div>

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
                onChange={onInputChange}
                placeholder="Enter concise Vietnamese translation..."
                rows={2}
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm transition focus:outline-none focus:ring-2 ${
                  errors.vietnamese
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-indigo-500"
                }`}
              />
              {errors.vietnamese && (
                <p className="mt-1 text-sm text-red-500">{errors.vietnamese}</p>
              )}
            </div>

            {formError ? (
              <p className="mt-2 text-sm text-red-600">{formError}</p>
            ) : null}
          </form>
          <div className="mt-4 flex gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onSubmit}
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
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}
