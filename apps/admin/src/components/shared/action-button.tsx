"use client";

import { useActionState } from "react";
import { Button, FormError } from "ui";
import { ActionResult } from "@/lib/action-result";

type ActionButtonProps = {
  /** A Server Action with its arguments already bound. */
  action: (prev: ActionResult) => Promise<ActionResult>;
  label: string;
  variant?: "primary" | "outline" | "danger" | "success";
  size?: "sm" | "md";
  /** The rule that stops this action now. Disables the button and says why. */
  blocker?: string | null;
};

/** A one-button action — record a step, send a PO, approve a budget. */
export const ActionButton = ({ action, label, variant = "primary", size = "md", blocker }: ActionButtonProps) => {
  const [state, dispatch, isPending] = useActionState(action, {});
  return (
    <form action={dispatch} className="flex flex-col items-start gap-1">
      <Button type="submit" variant={variant} size={size} disabled={isPending || Boolean(blocker)} title={blocker ?? undefined}>
        {isPending ? "Working…" : label}
      </Button>
      {blocker && <p className="text-xs text-muted">{blocker}</p>}
      <FormError message={state.error} />
    </form>
  );
};
