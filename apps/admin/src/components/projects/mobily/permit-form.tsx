"use client";

import { usePermitForm } from "@/app/(dashboard)/projects/[uuid]/use-project-forms";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { TextField } from "@/components/forms/text-field";
import { permitAuthorities } from "@/db/enum";
import { PERMIT_AUTHORITY_LABELS } from "@/db/label";
import { FormAction } from "@/lib/action-result";

type PermitFormProps = {
  action: FormAction;
};

export const PermitForm = ({ action }: PermitFormProps) => {
  const { form, state, isPending, onSubmit } = usePermitForm(action);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Request permit" columns={2}>
      <DropdownField name="authority" label="Authority" options={permitAuthorities.map((a) => ({ value: a, label: PERMIT_AUTHORITY_LABELS[a] }))} />
      <TextField name="reference" label="Reference" />
      <TextField name="requestedAt" label="Requested" type="date" />
      <TextField name="durationDays" label="Duration (days)" type="number" />
    </ActionForm>
  );
};
