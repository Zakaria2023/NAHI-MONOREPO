"use client";

import { DropdownOption } from "ui";
import { BUDGET_CATEGORY_LABELS, EXPENSE_CATEGORY_LABELS } from "@/db/label";
import { budgetCategories, expenseCategories } from "@/db/enum";
import { useExpenseForm } from "@/app/(dashboard)/finance/expenses/new/use-expense-form";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { LinesField } from "@/components/forms/lines-field";
import { TextField } from "@/components/forms/text-field";

type ExpenseFormProps = {
  centres: DropdownOption[];
};

export const ExpenseForm = ({ centres }: ExpenseFormProps) => {
  const { form, state, isPending, onSubmit, vehicle } = useExpenseForm();
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Record expense" columns={3}>
      <div className="md:col-span-2">
        <TextField name="description" label="Description" required />
      </div>
      <TextField name="date" label="Date" type="date" required />
      <DropdownField name="category" label="Category" options={expenseCategories.map((c) => ({ value: c, label: EXPENSE_CATEGORY_LABELS[c] }))} />
      <DropdownField
        name="budgetCategory"
        label="Budget line (if a project)"
        options={budgetCategories.map((c) => ({ value: c, label: BUDGET_CATEGORY_LABELS[c] }))}
      />
      <div />
      <TextField name="amount" label="Amount excl. VAT (SAR)" type="number" required />
      <TextField name="vat" label="VAT (SAR)" type="number" />
      <div />
      {vehicle && (
        <p className="rounded-control border border-warning/30 bg-warning-tint px-3 py-2 text-sm text-warning md:col-span-3">
          A vehicle expense is charged to exactly two cost centres — usually the vehicle and the project it served.
        </p>
      )}
      <LinesField
        name="allocations"
        label="Cost centres"
        emptyRow={{ costCenterUuid: "", amount: "" }}
        columns={[
          { name: "costCenterUuid", label: "Cost centre", type: "select", options: centres, span: 6 },
          { name: "amount", label: "Share (SAR)", type: "number", span: 3 },
        ]}
      />
    </ActionForm>
  );
};
