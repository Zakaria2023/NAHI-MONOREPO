"use client";

import { DropdownOption } from "ui";
import { useSubcontractForm } from "@/app/(dashboard)/finance/subcontracts/new/use-subcontract-form";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { TextField } from "@/components/forms/text-field";
import { budgetCategories } from "@/db/enum";
import { BUDGET_CATEGORY_LABELS } from "@/db/label";

type SubcontractFormProps = {
  subcontractorOptions: DropdownOption[];
  projectOptions: DropdownOption[];
};

export const SubcontractForm = ({ subcontractorOptions, projectOptions }: SubcontractFormProps) => {
  const { form, state, isPending, onSubmit } = useSubcontractForm();
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Create subcontract" columns={2}>
      <DropdownField name="subcontractorUuid" label="Subcontractor" required options={subcontractorOptions} />
      <DropdownField name="projectUuid" label="Project" required options={projectOptions} />
      <TextField name="scope" label="Scope of work" required placeholder="Civil works — trenching and duct laying" />
      <DropdownField
        name="budgetCategory"
        label="Budget line charged"
        required
        options={budgetCategories.map((c) => ({ value: c, label: BUDGET_CATEGORY_LABELS[c] }))}
      />
      <TextField name="value" label="Contract value (SAR, excl. VAT)" type="number" required />
      <TextField name="retentionPct" label="Retention %" type="number" required />
      <TextField name="advancePaid" label="Advance paid (SAR)" type="number" />
    </ActionForm>
  );
};
