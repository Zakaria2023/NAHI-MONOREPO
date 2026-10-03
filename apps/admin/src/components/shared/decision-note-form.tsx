"use client";

import { Button, FormError, Textarea } from "ui";
import { ActionResult } from "@/lib/action-result";
import { useDecisionForm } from "@/lib/use-decision-form";

type Decision = "approved" | "rejected";

type DecisionNoteFormProps = {
  action: (prev: ActionResult, data: { decision: Decision; note?: string }) => Promise<ActionResult>;
  decision: Decision;
  submitLabel: string;
};

/** The note and the confirm button inside an approve or reject dialog. */
export const DecisionNoteForm = ({ action, decision, submitLabel }: DecisionNoteFormProps) => {
  const { note, setNote, decide, isPending, error } = useDecisionForm(action);
  return (
    <div className="flex flex-col gap-4">
      <Textarea
        label={decision === "rejected" ? "Reason (required)" : "Note"}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder={decision === "rejected" ? "Why it is rejected" : "Optional"}
      />
      <FormError message={error ?? undefined} />
      <div>
        <Button variant={decision === "approved" ? "success" : "danger"} onClick={() => decide(decision)} disabled={isPending}>
          {isPending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </div>
  );
};
