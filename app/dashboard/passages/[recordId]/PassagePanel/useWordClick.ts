import { useCallback, useState } from "react";

import { PopupState } from "./types";

type UseWordClickResult = {
  popupState: PopupState | null;
  anchorEl: HTMLElement | null;
  handleWordClick: (word: string, element: HTMLElement) => void;
  resetPopupState: () => void;
};

export function useWordClick(): UseWordClickResult {
  const [popupState, setPopupState] = useState<PopupState | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleWordClick = useCallback((word: string, element: HTMLElement) => {
    setPopupState({ word });
    setAnchorEl(element);
  }, []);

  const resetPopupState = useCallback(() => {
    setPopupState(null);
    setAnchorEl(null);
  }, []);

  return { popupState, anchorEl, handleWordClick, resetPopupState };
}
