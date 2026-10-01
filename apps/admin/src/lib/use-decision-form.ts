"use client";

import { startTransition, useActionState, useState } from "react";
import { ActionResult } from "@/lib/action-result";

type Decision = "approved" | "rejected";

/**
 * The approve/reject pair every approval chain shows. A rejection needs a
 * reason; the services refuse one without, and this says so first.
 */
export const useDecisionForm = (
  action: (prev: ActionResult, data: { decision: Decision; note?: string }) => Promise<ActionResult>,
) => {
  const [state, dispatch, isPending] = useActionState(action, {});
  const [note, setNote] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

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
