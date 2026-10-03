"use client";

import { extractDecisionSchema } from "validators";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";

/**
 * One decision on an extract, from its dialog. Approving can set the
 * penalties (finance §2 step 5); the schema refuses a rejection without a
 * reason, under the note.
 */
export const useExtractDecisionForm = (action: FormAction, decision: "approved" | "rejected", penalties: number, penaltyNote?: string) =>
  useActionForm(extractDecisionSchema, action, {
    decision,
    note: "",
    penalties,
    penaltyNote: penaltyNote ?? "",
  });
