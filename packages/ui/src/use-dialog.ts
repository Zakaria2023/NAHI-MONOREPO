"use client";

import { MouseEvent, useEffect, useRef } from "react";

/**
 * Drives a native `<dialog>`: opens it as a modal (focus trap, Escape and the
 * backdrop for free), closes it when `open` turns false, and reports a close
 * the browser made — Escape, or a click on the backdrop — through `onClose`.
 */
export const useDialog = (open: boolean, onClose: () => void) => {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) {
      return;
    }
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, [onClose]);

  /** A click that lands on the dialog element itself is a click on its backdrop. */
  const onBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return { ref, onBackdropClick };
};
