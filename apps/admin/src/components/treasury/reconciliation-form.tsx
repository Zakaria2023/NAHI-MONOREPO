"use client";

import { useReconciliationForm } from "@/app/(dashboard)/finance/bank/use-bank-forms";
import { ActionForm } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/text-field";
import { FormAction } from "@/lib/action-result";

type ReconciliationFormProps = {
  action: FormAction;
  period: string;
};

export const ReconciliationForm = ({ action, period }: ReconciliationFormProps) => {
  const { form, state, isPending, onSubmit } = useReconciliationForm(action, period);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Reconcile">
      <TextField name="statementBalance" label="Closing balance on the bank statement (SAR)" type="number" />
    </ActionForm>
  );
};
