"use client";

import { DropdownOption } from "ui";
import { useAsBuiltInvoiceForm } from "@/app/(dashboard)/finance/receivables/use-receivable-forms";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { TextField } from "@/components/forms/text-field";

type AsBuiltInvoiceFormProps = {
  projectOptions: DropdownOption[];
};

export const AsBuiltInvoiceForm = ({ projectOptions }: AsBuiltInvoiceFormProps) => {
  const { form, state, isPending, onSubmit } = useAsBuiltInvoiceForm();
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Issue tax invoice" columns={2}>
      <DropdownField name="projectUuid" label="STC project" required options={projectOptions} />
      <TextField name="amount" label="Amount (SAR, excl. VAT)" type="number" required />
      <TextField name="submittedAt" label="Issued on" type="date" required />
      <TextField name="paymentTermsDays" label="Payment terms (days)" type="number" required />
    </ActionForm>
  );
};
