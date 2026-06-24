import { RefObject, useCallback, useEffect, useRef, useState } from "react";

import { PopupState } from "./types";

type TriggerPosition = {
  top: number;
  left: number;
};

type UseSelectionPopupParams = {
  containerRef: RefObject<HTMLDivElement | null>;
  onSelectWord: (word: string) => void;
};

type UseSelectionPopupResult = {
  popupState: PopupState | null;
  triggerPosition: TriggerPosition | null;
  captureSelection: () => void;
  resetPopupState: () => void;
};

export function useSelectionPopup({
  containerRef,
  onSelectWord,
}: UseSelectionPopupParams): UseSelectionPopupResult {
  const anchorRangeRef = useRef<Range | null>(null);
  const [popupState, setPopupState] = useState<PopupState | null>(null);
  const [triggerPosition, setTriggerPosition] =
    useState<TriggerPosition | null>(null);

  const resetPopupState = useCallback(() => {
    anchorRangeRef.current = null;
    setPopupState(null);
    setTriggerPosition(null);
  }, []);

  const syncTriggerPosition = useCallback(() => {
    const range = anchorRangeRef.current;

    if (!range) {
      setTriggerPosition(null);
      return;
    }

    const rect = range.getBoundingClientRect();

    if (!rect.width && !rect.height) {
      setTriggerPosition(null);
      return;
    }

    setTriggerPosition((current) => {
      const next = {
        left: Math.max(8, rect.left),
        top: Math.max(8, rect.bottom + 8),
      };

      if (current && current.left === next.left && current.top === next.top) {
        return current;
      }

      return next;
    });
  }, []);

  useEffect(() => {
    if (!popupState) {
      return;
    }

    let frameId = 0;

    const requestPositionSync = () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(() => {
        syncTriggerPosition();
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
  }, [popupState, syncTriggerPosition]);

  const captureSelection = useCallback(() => {
    const selection = window.getSelection();
    const rawSelection = selection?.toString().trim();

    if (!rawSelection || !containerRef.current) {
      return;
    }

    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;

    if (
      !range ||
      !containerRef.current.contains(range.commonAncestorContainer)
    ) {
      return;
    }

    const rect = range.getBoundingClientRect();

    if (!rect.width && !rect.height) {
      return;
    }

    onSelectWord(rawSelection);
    anchorRangeRef.current = range.cloneRange();
    setPopupState({ word: rawSelection });
    syncTriggerPosition();
  }, [containerRef, onSelectWord, syncTriggerPosition]);

  return {
    popupState,
    triggerPosition,
    captureSelection,
    resetPopupState,
  };
}
