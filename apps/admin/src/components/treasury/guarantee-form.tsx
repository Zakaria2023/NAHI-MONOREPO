"use client";

import { DropdownOption } from "ui";
import { GUARANTEE_KIND_LABELS } from "@/db/label";
import { guaranteeKinds } from "@/db/enum";
import { useGuaranteeForm } from "@/app/(dashboard)/finance/guarantees/use-guarantee-form";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { TextField } from "@/components/forms/text-field";

type GuaranteeFormProps = {
  projects: DropdownOption[];
};

export const GuaranteeForm = ({ projects }: GuaranteeFormProps) => {
  const { form, state, isPending, onSubmit } = useGuaranteeForm();
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Record guarantee" columns={2}>
      <TextField name="number" label="Bank reference" required />
      <TextField name="bank" label="Bank" required />
      <DropdownField name="kind" label="Kind" options={guaranteeKinds.map((k) => ({ value: k, label: GUARANTEE_KIND_LABELS[k] }))} />
      <TextField name="beneficiary" label="Beneficiary" placeholder="Mobily, STC…" required />
      <DropdownField name="projectUuid" label="Project" options={projects} />
      <TextField name="amount" label="Amount (SAR)" type="number" required />
      <TextField name="issuedAt" label="Issued" type="date" />
      <TextField name="expiresAt" label="Expires" type="date" />
    </ActionForm>
  );
};
