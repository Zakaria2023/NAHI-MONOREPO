"use client";

import { BUDGET_CATEGORY_LABELS, EQUIPMENT_SUPPLY_TYPE_LABELS, WORK_TYPE_LABELS } from "@/db/label";
import { budgetCategories, equipmentSupplyTypes, workTypes } from "@/db/enum";
import { useStudyLineForm } from "@/app/(dashboard)/finance/budgets/[projectUuid]/study/use-study-forms";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { TextField } from "@/components/forms/text-field";
import { FormAction } from "@/lib/action-result";

type StudyLineFormProps = {
  action: FormAction;
};

export const StudyLineForm = ({ action }: StudyLineFormProps) => {
  const { form, state, isPending, onSubmit, equipment, works } = useStudyLineForm(action);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Add line" submitVariant="outline" columns={2}>
      <div className="md:col-span-2">
        <DropdownField name="category" label="Category" options={budgetCategories.map((c) => ({ value: c, label: BUDGET_CATEGORY_LABELS[c] }))} />
      </div>
      <div className="md:col-span-2">
        <TextField name="description" label="Description" placeholder="Trench excavation · Site engineer · Excavator" />
      </div>
      <TextField name="qty" label="Quantity / headcount" type="number" />
      <TextField name="unit" label="Unit" placeholder="m, pcs, day, person-month" />
      <TextField name="unitCost" label="Unit cost (SAR)" type="number" />
      <TextField name="duration" label="Duration (0 if none)" type="number" />
      {equipment && (
        <DropdownField
          name="supplyType"
          label="Supplied as"
          options={[{ value: "", label: "—" }, ...equipmentSupplyTypes.map((t) => ({ value: t, label: EQUIPMENT_SUPPLY_TYPE_LABELS[t] }))]}
        />
      )}
      {works && (
        <DropdownField name="workType" label="Work" options={[{ value: "", label: "—" }, ...workTypes.map((t) => ({ value: t, label: WORK_TYPE_LABELS[t] }))]} />
      )}
    </ActionForm>
  );
};
