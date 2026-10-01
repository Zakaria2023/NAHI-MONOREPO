"use client";

import { useCancelOrderForm } from "@/app/(dashboard)/procurement/orders/[uuid]/use-order-forms";
import { ActionForm } from "@/components/forms/action-form";
import { TextareaField } from "@/components/forms/textarea-field";
import { FormAction } from "@/lib/action-result";

type CancelOrderFormProps = {
  action: FormAction;
};

export const CancelOrderForm = ({ action }: CancelOrderFormProps) => {
  const { form, state, isPending, onSubmit } = useCancelOrderForm(action);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Cancel PO" submitVariant="outline">
      <TextareaField name="note" label="Reason" placeholder="Kept in the PO's change log" />
    </ActionForm>
  );
};
