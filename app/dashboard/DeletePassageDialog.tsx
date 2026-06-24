"use client";

import { Dialog, Portal } from "@chakra-ui/react";

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
    <Dialog.Root
      lazyMount
      unmountOnExit
      open={open}
      onOpenChange={(details) => {
        if (!details.open && !isPending) {
          onClose();
        }
      }}
    >
      {open ? (
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner p="4">
            <Dialog.Content
              aria-label="Delete passage confirmation dialog"
              className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-lg"
            >
              <Dialog.Header
                className="flex items-center justify-between border-b border-gray-200 px-5"
                paddingTop={3}
                paddingBottom={3}
              >
                <h3 className="text-base font-semibold text-gray-900">
                  Delete passage?
                </h3>
                <Dialog.CloseTrigger asChild top={3} right={3}>
                  <button
                    type="button"
                    aria-label="Close dialog"
                    className="rounded-md p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-5 w-5"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </Dialog.CloseTrigger>
              </Dialog.Header>

              <Dialog.Body className="px-5 py-4">
                <p className="text-sm text-gray-600">
                  This will permanently remove{" "}
                  <span className="font-medium text-gray-900">{title}</span>. It
                  will also remove this passage from linked vocabulary, and any
                  vocabulary that no longer belongs to any passage will be
                  deleted.
                </p>
                {deleteError ? (
                  <p className="mt-3 text-sm text-red-600">{deleteError}</p>
                ) : null}
              </Dialog.Body>

              <Dialog.Footer className="flex gap-3 border-t border-gray-200 px-5 py-4">
                <Dialog.ActionTrigger
                  disabled={isPending}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </Dialog.ActionTrigger>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={onConfirm}
                  className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {isPending ? "Deleting..." : "Delete"}
                </button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      ) : null}
    </Dialog.Root>
  );
}
