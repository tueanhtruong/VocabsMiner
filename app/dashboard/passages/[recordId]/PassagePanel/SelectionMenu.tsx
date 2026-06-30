import { useCallback, useEffect, useRef, useState } from "react";
import { Menu } from "@mantine/core";

import { PopupState } from "./types";
import { useSpeech } from "./useSpeech";

type SelectionMenuProps = {
  popupState: PopupState | null;
  anchorEl: HTMLElement | null;
  translation: string | null;
  translationError: string | null;
  isTranslating: boolean;
  isGeneratingDraft: boolean;
  isSelectedWordDuplicated: boolean;
  phonetics?: string | null;
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
  phonetics,
  onClose,
  onGenerateDraft,
}: SelectionMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { speak, lookup } = useSpeech();
  const [fetchedPhonetic, setFetchedPhonetic] = useState<string | null>(null);
  const lastPositionRef = useRef<{ top: number; left: number } | null>(null);

  // Fetch the dictionary phonetic for the selected word.
  useEffect(() => {
    let active = true;

    lookup(popupState?.word ?? "").then((result) => {
      if (active) {
        setFetchedPhonetic(result.phonetic);
      }
    });

    return () => {
      active = false;
    };
  }, [popupState?.word, lookup]);

  // Position the hidden trigger at the anchor element's current location so
  // Floating UI can place the dropdown relative to it. Returns true when the
  // trigger actually moved.
  const syncTriggerPosition = useCallback((): boolean => {
    if (!anchorEl || !triggerRef.current) {
      return false;
    }

    const rect = anchorEl.getBoundingClientRect();
    const containingBlock = findFixedContainingBlock(triggerRef.current);

    let top: number;
    let left: number;

    if (containingBlock) {
      const containingBlockRect = containingBlock.getBoundingClientRect();

      top = rect.bottom - containingBlockRect.top + containingBlock.scrollTop;
      left = rect.left - containingBlockRect.left + containingBlock.scrollLeft;
    } else {
      top = rect.bottom;
      left = rect.left;
    }

    const previous = lastPositionRef.current;

    if (previous && previous.top === top && previous.left === left) {
      return false;
    }

    triggerRef.current.style.top = `${top}px`;
    triggerRef.current.style.left = `${left}px`;
    lastPositionRef.current = { top, left };

    return true;
  }, [anchorEl]);

  // Keep the trigger aligned with the word while the user scrolls or resizes.
  // On desktop the passage scrolls inside an inner container that is NOT an
  // ancestor of the (sibling) trigger button, so Mantine's Floating UI
  // autoUpdate never hears that scroll. We listen on the window in the capture
  // phase to catch the inner container's scroll, reposition the trigger, and
  // dispatch a synthetic resize so Floating UI recomputes the dropdown. The
  // position-change guard in syncTriggerPosition prevents an event loop.
  useEffect(() => {
    if (!anchorEl) {
      return;
    }

    lastPositionRef.current = null;
    let frameId = 0;

    const requestPositionSync = () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(() => {
        if (syncTriggerPosition()) {
          window.dispatchEvent(new Event("resize"));
        }
      });
    };

    requestPositionSync();

    window.addEventListener("scroll", requestPositionSync, true);
    window.addEventListener("resize", requestPositionSync);

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      window.removeEventListener("scroll", requestPositionSync, true);
      window.removeEventListener("resize", requestPositionSync);
    };
  }, [anchorEl, syncTriggerPosition]);

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
        {/* Word header: phonetics + speak */}
        {popupState?.word ? (
          <div className="mb-2 flex items-center gap-2 px-2 pt-1">
            <span className="font-semibold text-gray-900">
              {popupState.word}
            </span>
            {(phonetics ?? fetchedPhonetic) ? (
              <span className="text-sm text-gray-500">
                {phonetics ?? fetchedPhonetic}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => speak(popupState.word)}
              aria-label={`Pronounce ${popupState.word}`}
              className="ml-auto rounded-md p-1 text-indigo-500 transition hover:bg-indigo-50 hover:text-indigo-700"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            </button>
          </div>
        ) : null}

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
