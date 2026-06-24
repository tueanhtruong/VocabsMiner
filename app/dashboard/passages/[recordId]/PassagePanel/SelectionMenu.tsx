import { Menu, Portal } from "@chakra-ui/react";

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
  if (!anchorEl) {
    return null;
  }

  return (
    <Menu.Root
      open={Boolean(popupState && anchorEl)}
      onOpenChange={(details) => {
        if (!details.open) {
          onClose();
        }
      }}
      positioning={{
        strategy: "fixed",
        placement: "bottom-start",
        gutter: 8,
        getAnchorElement: () => anchorEl,
      }}
    >
      <Menu.Trigger asChild>
        <span
          aria-hidden
          style={{
            position: "fixed",
            left: -9999,
            top: -9999,
            width: 0,
            height: 0,
            pointerEvents: "none",
          }}
        />
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner zIndex="modal">
          <Menu.Content
            minW="18rem"
            maxW="32rem"
            rounded="xl"
            borderWidth="1px"
            borderColor="gray.200"
            bg="white"
            p="2"
            shadow="2xl"
          >
            <Menu.Item
              value="translated-word"
              cursor="default"
              disabled={isTranslating}
              bg="white"
              color="cyan.950"
              fontSize="md"
              fontWeight="medium"
              py="2"
            >
              {isTranslating
                ? "Translating..."
                : translation
                  ? translation
                  : "Translate to Vietnamese"}
            </Menu.Item>

            <Menu.Item
              value="create-vocabulary-draft"
              closeOnSelect={false}
              disabled={isGeneratingDraft || isSelectedWordDuplicated}
              onSelect={onGenerateDraft}
              rounded="lg"
              borderWidth="1px"
              borderColor="gray.200"
              bg="white"
              color="gray.900"
              fontSize="md"
              fontWeight="medium"
              py="2"
              mt="2"
              _hover={{ bg: "gray.50" }}
              _disabled={{ opacity: 0.5 }}
            >
              {isSelectedWordDuplicated
                ? "Word already exists in this passage vocabulary"
                : isGeneratingDraft
                  ? "Preparing vocabulary data..."
                  : "Add vocabulary to the list"}
            </Menu.Item>

            {isSelectedWordDuplicated ? (
              <p className="px-2 pt-2 text-xs text-amber-600">
                The selected word is already in your vocabulary list.
              </p>
            ) : null}

            {translationError ? (
              <p className="px-2 pt-2 text-xs text-red-600">
                {translationError}
              </p>
            ) : null}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
