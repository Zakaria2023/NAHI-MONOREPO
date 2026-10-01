"use client";

import { DropdownOption } from "ui";
import { formatMoney } from "utils";
import { useCashCustodyForm } from "@/app/(dashboard)/custody/new/use-cash-custody-form";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { LinesField } from "@/components/forms/lines-field";
import { TextField } from "@/components/forms/text-field";
import { budgetCategories } from "@/db/enum";
import { BUDGET_CATEGORY_LABELS } from "@/db/label";

type CashCustodyFormProps = {
  projects: DropdownOption[];
};

export const CashCustodyForm = ({ projects }: CashCustodyFormProps) => {
  const { form, state, isPending, onSubmit, total } = useCashCustodyForm();
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Request custody" columns={2}>
      <TextField name="employeeName" label="Employee" required />
      <DropdownField name="projectUuid" label="Project" required options={projects} />
      <DropdownField
        name="budgetCategory"
        label="Budget category"
        required
        options={budgetCategories.map((c) => ({ value: c, label: BUDGET_CATEGORY_LABELS[c] }))}
      />
      <TextField name="city" label="City" required />
      <TextField name="workOrderNo" label="Work order number" required />
      <div />
      <LinesField
        name="lines"
        label="Details"
        emptyRow={{ description: "", amount: 0 }}
        columns={[
          { name: "description", label: "Description", type: "text", span: 6 },
          { name: "amount", label: "Amount (SAR)", type: "number", span: 5 },
        ]}
      />
      <div className="flex items-center justify-end gap-3 md:col-span-2">
        <span className="text-sm text-muted">Custody total</span>
        <span className="text-lg text-ink">{formatMoney(total)}</span>
      </div>
    </ActionForm>
  );
};
