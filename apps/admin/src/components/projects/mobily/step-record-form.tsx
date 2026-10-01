"use client";

import { useMobilyStepForm } from "@/app/(dashboard)/projects/[uuid]/use-project-forms";
import { ActionForm } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/text-field";
import { MobilyStep } from "@/db/enum";
import { FormAction } from "@/lib/action-result";

type StepRecordFormProps = {
  action: FormAction;
  step: MobilyStep;
};

export const StepRecordForm = ({ action, step }: StepRecordFormProps) => {
  const { form, state, isPending, onSubmit } = useMobilyStepForm(action, step);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Record" layout="inline">
      <div className="w-40">
        <TextField name="at" label="Date" type="date" />
      </div>
      {step === "po_received" && (
        <div className="w-44">
          <TextField name="poNumber" label="PO number" placeholder="MOB-PO-…" />
        </div>
      )}
      <div className="min-w-48 flex-1">
        <TextField name="note" label="Note / reference" />
      </div>
    </ActionForm>
  );
};
