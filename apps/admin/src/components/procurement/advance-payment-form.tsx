"use client";

import { useAdvancePaymentForm } from "@/app/(dashboard)/procurement/orders/[uuid]/use-order-forms";
import { ActionForm } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/text-field";
import { FormAction } from "@/lib/action-result";

type AdvancePaymentFormProps = {
  action: FormAction;
};

export const AdvancePaymentForm = ({ action }: AdvancePaymentFormProps) => {
  const { form, state, isPending, onSubmit } = useAdvancePaymentForm(action);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Record advance" layout="inline" submitVariant="outline">
      <div className="w-48">
        <TextField name="amount" label="Advance paid (SAR)" type="number" />
      </div>
    </ActionForm>
  );
};
