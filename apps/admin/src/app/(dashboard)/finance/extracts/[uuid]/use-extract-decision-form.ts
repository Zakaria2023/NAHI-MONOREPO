"use client";

import { extractDecisionSchema } from "validators";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";

/**
 * The extract's approve/reject, which also carries the penalties (finance §2
 * step 5). The schema refuses a rejection without a reason, under the note.
 */
export const useExtractDecisionForm = (action: FormAction, penalties: number, penaltyNote?: string) => {
  const { form, state, isPending, onSubmit } = useActionForm(extractDecisionSchema, action, {
    decision: "approved",
    note: "",
    penalties,
    penaltyNote: penaltyNote ?? "",
  });
  const decide = (decision: "approved" | "rejected") => {
    form.setValue("decision", decision);
    void onSubmit();
  };
  return { form, state, isPending, decide };
};
