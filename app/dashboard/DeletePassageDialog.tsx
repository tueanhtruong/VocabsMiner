"use client";

import { Modal } from "@mantine/core";

type DeletePassageDialogProps = {
  open: boolean;
  title: string | null;
  isPending: boolean;
  deleteError: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeletePassageDialog({
  open,
  title,
  isPending,
  deleteError,
  onClose,
  onConfirm,
}: DeletePassageDialogProps) {
  return (
    <Modal.Root
      opened={open}
      onClose={() => {
        if (!isPending) {
          onClose();
        }
      }}
      size="24rem"
      centered
    >
      <Modal.Overlay />
      <Modal.Content
        aria-label="Delete passage confirmation dialog"
        className=""
      >
        <Modal.Header className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h3 className="font-semibold text-gray-900">Delete passage?</h3>
          <Modal.CloseButton aria-label="Close dialog" />
        </Modal.Header>

        <Modal.Body className="px-5 py-4">
          <p className="text-md text-gray-600 mt-3">
            This will permanently remove{" "}
            <span className="font-medium text-gray-900">{title}</span>. It will
            also remove this passage from linked vocabulary, and any vocabulary
            that no longer belongs to any passage will be deleted.
          </p>
          {deleteError ? (
            <p className="mt-3 text-sm text-red-600">{deleteError}</p>
          ) : null}
          <div className="mt-4 flex gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              disabled={isPending}
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={onConfirm}
              className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? "Deleting..." : "Delete"}
            </button>
          </div>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}
