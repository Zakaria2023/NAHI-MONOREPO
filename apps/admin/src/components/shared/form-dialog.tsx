"use client";

import { ReactNode, useCallback, useState } from "react";
import { Button, Dialog } from "ui";
import { DialogCloseContext } from "@/lib/dialog-close";

type FormDialogProps = {
  /** The button that opens it. */
  label: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  variant?: "primary" | "outline" | "danger" | "success";
  size?: "sm" | "md";
  /** "lg" for a form laid out in two columns. */
  dialogSize?: "md" | "lg";
  /** The rule that stops this action now: the button is disabled and says why. */
  blocker?: string | null;
  /** The small form. It closes the dialog itself once it has saved. */
  children: ReactNode;
};

/** A small form behind a button: the button opens it in a dialog, and a successful save closes it. */
export const FormDialog = ({ label, title, description, icon, variant = "outline", size = "md", dialogSize = "md", blocker, children }: FormDialogProps) => {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <div className="flex flex-col items-start gap-1">
      <Button variant={variant} size={size} onClick={() => setOpen(true)} disabled={Boolean(blocker)} title={blocker ?? undefined}>
        {icon}
        {label}
      </Button>
      {blocker && <p className="text-xs text-muted">{blocker}</p>}
      <Dialog open={open} onClose={close} title={title} description={description} size={dialogSize}>
        <DialogCloseContext.Provider value={close}>{children}</DialogCloseContext.Provider>
      </Dialog>
    </div>
  );
};
