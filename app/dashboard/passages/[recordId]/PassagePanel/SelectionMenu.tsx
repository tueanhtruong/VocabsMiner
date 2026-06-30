import { useEffect, useRef } from "react";
import { Menu } from "@mantine/core";

import { PopupState } from "./types";

type SelectionMenuProps = {
  popupState: PopupState | null;
  anchorEl: HTMLElement | null;
  translation: string | null;
  translationError: string | null;
  isTranslating: boolean;
  isGeneratingDraft: boolean;
  isSelectedWordDuplicated: boolean;
  onClose: () => void;
  onGenerateDraft: () => void;
};

function findFixedContainingBlock(element: HTMLElement): HTMLElement | null {
  let current = element.parentElement;

  while (current) {
    const style = window.getComputedStyle(current);
    const hasTransformContainingBlock =
      style.transform !== "none" ||
      style.perspective !== "none" ||
      style.filter !== "none" ||
      style.backdropFilter !== "none" ||
      style.willChange.includes("transform");

    if (hasTransformContainingBlock) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

export function SelectionMenu({
  popupState,
  anchorEl,
  translation,
  translationError,
  isTranslating,
  isGeneratingDraft,
  isSelectedWordDuplicated,
  onClose,
  onGenerateDraft,
}: SelectionMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Position the hidden trigger at the anchor element's location so
  // Floating UI can place the dropdown relative to it.
  useEffect(() => {
    if (anchorEl && triggerRef.current) {
      const rect = anchorEl.getBoundingClientRect();
      const containingBlock = findFixedContainingBlock(triggerRef.current);

      if (containingBlock) {
        const containingBlockRect = containingBlock.getBoundingClientRect();

        triggerRef.current.style.top = `${
          rect.bottom - containingBlockRect.top + containingBlock.scrollTop
        }px`;
        triggerRef.current.style.left = `${
          rect.left - containingBlockRect.left + containingBlock.scrollLeft
        }px`;
        return;
      }

      triggerRef.current.style.top = `${rect.bottom}px`;
      triggerRef.current.style.left = `${rect.left}px`;
    }
  }, [anchorEl]);

  if (!anchorEl) {
    return null;
  }

  return (
    <Menu
      opened={Boolean(popupState && anchorEl)}
      onChange={(opened) => {
        if (!opened) {
          onClose();
        }
      }}
      position="bottom-start"
      floatingStrategy="fixed"
      offset={8}
      withinPortal
      zIndex={9999}
    >
      <Menu.Target>
        <button
          ref={triggerRef}
          aria-hidden
          tabIndex={-1}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: 0,
            height: 0,
            padding: 0,
            border: "none",
            background: "none",
            pointerEvents: "none",
            overflow: "hidden",
          }}
        />
      </Menu.Target>

      <Menu.Dropdown className="min-w-72 max-w-[32rem] rounded-xl border border-gray-200 bg-white p-2 shadow-2xl">
        <Menu.Item
          closeMenuOnClick={false}
          disabled={isTranslating}
          className="cursor-default rounded-lg border border-gray-200 bg-white px-2 py-2 text-md font-medium text-cyan-950 hover:bg-white"
        >
          <p className="text-md font-medium text-gray-900">
            {isTranslating
              ? "Translating..."
              : translation
                ? translation
                : "Translate to Vietnamese"}
          </p>
        </Menu.Item>

        <Menu.Item
          closeMenuOnClick={false}
          disabled={isGeneratingDraft || isSelectedWordDuplicated}
          onClick={
            !isGeneratingDraft && !isSelectedWordDuplicated
              ? onGenerateDraft
              : undefined
          }
          className="mt-2 rounded-lg border border-gray-200 bg-white px-2 py-2 text-lg font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50"
        >
          <p className="text-md font-medium text-gray-900">
            {isSelectedWordDuplicated
              ? "Word already exists in this passage vocabulary"
              : isGeneratingDraft
                ? "Preparing vocabulary data..."
                : "Add vocabulary to the list"}
          </p>
        </Menu.Item>

        {isSelectedWordDuplicated ? (
          <p className="px-2 pt-2 text-sm text-amber-600">
            The selected word is already in your vocabulary list.
          </p>
        ) : null}

        {translationError ? (
          <p className="px-2 pt-2 text-xs text-red-600">{translationError}</p>
        ) : null}
      </Menu.Dropdown>
    </Menu>
  );
}
