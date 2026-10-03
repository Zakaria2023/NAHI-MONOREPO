"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { useActionState } from "react";
import { FormError } from "ui";
import { ButtonAction } from "@/lib/action-result";

type ChecklistItemToggleProps = {
  action: ButtonAction;
  done: boolean;
  label: string;
  /** Why it cannot be ticked now; the box shows but does not change. */
  blocker: string | null;
};

/** One checklist line: the whole line ticks or unticks it. */
export const ChecklistItemToggle = ({ action, done, label, blocker }: ChecklistItemToggleProps) => {
  const [state, dispatch, isPending] = useActionState(action, {});
  return (
    <form action={dispatch} className="flex flex-col gap-1">
      <button
        type="submit"
        disabled={Boolean(blocker) || isPending}
        title={blocker ?? undefined}
        className="flex items-start gap-2.5 text-start disabled:cursor-default enabled:hover:text-primary"
      >
        <span className={`mt-0.5 shrink-0 ${done ? "text-success" : "text-faint"} ${isPending ? "opacity-50" : ""}`}>
          {done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
        </span>
        <span className={`text-sm ${done ? "text-muted line-through" : "text-ink"}`}>{label}</span>
      </button>
      <FormError message={state.error} />
    </form>
  );
};
