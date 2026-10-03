"use client";

import { useClearanceForm } from "@/app/(dashboard)/custody/employees/use-clearance-form";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";

type ClearanceFormProps = {
  employeeName: string;
};

const REASONS = [
  { value: "resignation", label: "Leaving the company" },
  { value: "transfer", label: "Moving branch" },
];

export const ClearanceForm = ({ employeeName }: ClearanceFormProps) => {
  const { form, state, isPending, onSubmit } = useClearanceForm(employeeName);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Approve clearance" submitVariant="success">
      <div className="w-48">
        <DropdownField name="reason" label="Reason" options={REASONS} />
      </div>
    </ActionForm>
  );
};
