"use client";

import { X } from "lucide-react";
import { ReactNode } from "react";
import { useDialog } from "./use-dialog";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** "lg" for a form with two columns. */
  size?: "md" | "lg";
  children: ReactNode;
};

const SIZES = {
  md: "max-w-lg",
  lg: "max-w-2xl",
};

/**
 * A modal over the page, for a small form. Its content is mounted only while it
 * is open, so each opening starts fresh. Nothing inside clips — a small form is
 * short, and a dropdown's list must be free to hang below the dialog.
 */
export const Dialog = ({ open, onClose, title, description, size = "md", children }: DialogProps) => {
  const { ref, onBackdropClick } = useDialog(open, onClose);
  return (
    <dialog
      ref={ref}
      onClick={onBackdropClick}
      className={`fixed inset-4 m-auto h-fit w-auto ${SIZES[size]} overflow-visible rounded-card border border-hairline bg-surface p-0 text-ink shadow-xl backdrop:bg-zinc-950/50`}
    >
      {open && (
        <div className="flex flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-hairline-soft px-6 py-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-medium tracking-tight text-ink">{title}</h2>
              {description && <p className="text-sm text-muted">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-hover hover:text-ink"
            >
              <X size={16} />
            </button>
          </header>
          <div className="px-6 py-5">{children}</div>
        </div>
      )}
    </dialog>
  );
};
