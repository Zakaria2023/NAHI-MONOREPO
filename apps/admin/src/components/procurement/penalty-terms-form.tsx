"use client";

import { usePenaltyTermsForm } from "@/app/(dashboard)/procurement/orders/[uuid]/use-order-forms";
import { ActionForm } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/text-field";
import { FormAction } from "@/lib/action-result";

type PenaltyTermsFormProps = {
  action: FormAction;
  pctPerDay: number;
  capPct: number;
};

export const PenaltyTermsForm = ({ action, pctPerDay, capPct }: PenaltyTermsFormProps) => {
  const { form, state, isPending, onSubmit } = usePenaltyTermsForm(action, pctPerDay, capPct);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Save terms" submitVariant="outline" columns={2}>
      <TextField name="latePenaltyPctPerDay" label="% a day late" type="number" />
      <TextField name="latePenaltyCapPct" label="Cap (% of invoice)" type="number" />
    </ActionForm>
  );
};
