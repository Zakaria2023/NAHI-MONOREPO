"use client";

import { useStcStepForm } from "@/app/(dashboard)/projects/[uuid]/use-project-forms";
import { ActionForm } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/text-field";
import { StcM3Check, StcPatStep } from "@/db/enum";
import { FormAction } from "@/lib/action-result";

type StcStepFormProps = {
  action: FormAction;
  step: StcPatStep | StcM3Check;
};

export const StcStepForm = ({ action, step }: StcStepFormProps) => {
  const { form, state, isPending, onSubmit } = useStcStepForm(action, step);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Record" layout="inline">
      <div className="w-40">
        <TextField name="at" label="Date" type="date" />
      </div>
    </ActionForm>
  );
};
