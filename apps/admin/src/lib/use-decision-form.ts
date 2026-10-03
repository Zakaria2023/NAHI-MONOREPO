"use client";

import { startTransition, useActionState, useState } from "react";
import { ActionResult } from "@/lib/action-result";
import { useCloseOnSuccess } from "./use-close-on-success";

type Decision = "approved" | "rejected";

/**
 * One decision on an approval chain, from its dialog. A rejection needs a
 * reason; the services refuse one without, and this says so first. The dialog
 * closes once the decision is recorded.
 */
export const useDecisionForm = (
  action: (prev: ActionResult, data: { decision: Decision; note?: string }) => Promise<ActionResult>,
) => {
  const [state, dispatch, isPending] = useActionState(action, {});
  const [note, setNote] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  useCloseOnSuccess(state);

  const decide = (decision: Decision) => {
    if (decision === "rejected" && !note.trim()) {
      setLocalError("Write the reason for the rejection");
      return;
    }
    setLocalError(null);
    startTransition(() => dispatch({ decision, note: note.trim() || undefined }));
  };

  return { note, setNote, decide, isPending, error: localError ?? state.error };
};
