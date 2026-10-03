"use client";

import { useExtractDecisionForm } from "@/app/(dashboard)/finance/extracts/[uuid]/use-extract-decision-form";
import { ActionForm } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { FormAction } from "@/lib/action-result";

type ExtractDecisionNoteFormProps = {
  action: FormAction;
  decision: "approved" | "rejected";
  penalties: number;
  penaltyNote?: string;
};

/** Inside the approve or reject dialog: approving may set penalties, rejecting needs the reason. */
export const ExtractDecisionNoteForm = ({ action, decision, penalties, penaltyNote }: ExtractDecisionNoteFormProps) => {
  const { form, state, isPending, onSubmit } = useExtractDecisionForm(action, decision, penalties, penaltyNote);
  return (
    <ActionForm
      form={form}
      onSubmit={onSubmit}
      state={state}
      isPending={isPending}
      submitLabel={decision === "approved" ? "Approve" : "Reject"}
      submitVariant={decision === "approved" ? "success" : "outline"}
      columns={decision === "approved" ? 2 : 1}
    >
      {decision === "approved" && (
        <>
          <TextField name="penalties" label="Penalties (SAR)" type="number" />
          <TextField name="penaltyNote" label="Penalty reason" placeholder="Delay or breach" />
        </>
      )}
      <div className="md:col-span-full">
        <TextareaField name="note" label={decision === "rejected" ? "Reason (required)" : "Note"} placeholder={decision === "rejected" ? "Why it is rejected" : "Optional"} />
      </div>
    </ActionForm>
  );
};
