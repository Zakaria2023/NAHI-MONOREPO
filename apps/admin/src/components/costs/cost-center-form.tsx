"use client";

import { COST_CENTER_KIND_LABELS } from "@/db/label";
import { costCenterKinds } from "@/db/enum";
import { useCostCenterForm } from "@/app/(dashboard)/finance/expenses/use-expense-forms";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { TextField } from "@/components/forms/text-field";

export const CostCenterForm = () => {
  const { form, state, isPending, onSubmit } = useCostCenterForm();
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Add cost centre" submitVariant="outline" columns={2}>
      <TextField name="code" label="Code" placeholder="VEH-03" />
      <DropdownField name="kind" label="Kind" options={costCenterKinds.map((k) => ({ value: k, label: COST_CENTER_KIND_LABELS[k] }))} />
      <div className="md:col-span-2">
        <TextField name="name" label="Name" placeholder="Isuzu crane truck" />
      </div>
    </ActionForm>
  );
};
