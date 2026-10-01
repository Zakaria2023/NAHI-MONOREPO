"use client";

import { useInvoiceCollectionForm } from "@/app/(dashboard)/finance/receivables/use-receivable-forms";
import { ActionForm } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/text-field";
import { FormAction } from "@/lib/action-result";

type InvoiceCollectionFormProps = {
  action: FormAction;
};

export const InvoiceCollectionForm = ({ action }: InvoiceCollectionFormProps) => {
  const { form, state, isPending, onSubmit } = useInvoiceCollectionForm(action);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Mark collected" layout="inline" submitVariant="success">
      <div className="w-36">
        <TextField name="paidAt" label="Collected on" type="date" />
      </div>
    </ActionForm>
  );
};
