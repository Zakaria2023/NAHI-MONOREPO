"use client";

import { usePayRunForm } from "@/app/(dashboard)/payroll/runs/[uuid]/use-pay-run-form";
import { ActionForm } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/text-field";
import { FormAction } from "@/lib/action-result";

type PayRunFormProps = {
  action: FormAction;
};

export const PayRunForm = ({ action }: PayRunFormProps) => {
  const { form, state, isPending, onSubmit } = usePayRunForm(action);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Mark salaries paid" submitVariant="success">
      <TextField name="bankReference" label="Bank transfer reference" placeholder="WPS batch number" required />
    </ActionForm>
  );
};
