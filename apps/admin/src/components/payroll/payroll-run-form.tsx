"use client";

import { DropdownOption } from "ui";
import { useRunForm } from "@/app/(dashboard)/payroll/runs/use-run-form";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";

type PayrollRunFormProps = {
  /** The recent months not yet run. */
  periods: DropdownOption[];
};

export const PayrollRunForm = ({ periods }: PayrollRunFormProps) => {
  const { form, state, isPending, onSubmit } = useRunForm(periods[0]?.value ?? "");
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Calculate payroll">
      <div className="w-64">
        <DropdownField name="period" label="Month" options={periods} />
      </div>
    </ActionForm>
  );
};
