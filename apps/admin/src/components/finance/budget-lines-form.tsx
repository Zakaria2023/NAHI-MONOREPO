"use client";

import { EMPTY_BUDGET_LINE, useBudgetLinesForm } from "@/app/(dashboard)/finance/budgets/[projectUuid]/lines/use-budget-lines-form";
import { ActionForm } from "@/components/forms/action-form";
import { LinesField } from "@/components/forms/lines-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { BudgetCategory, budgetCategories } from "@/db/enum";
import { BUDGET_CATEGORY_LABELS } from "@/db/label";
import { FormAction } from "@/lib/action-result";

type BudgetLinesFormProps = {
  action: FormAction;
  lines: { category: BudgetCategory; planned: number }[];
  /** An approved budget changes only with a reason, kept in the revisions log. */
  approved: boolean;
};

export const BudgetLinesForm = ({ action, lines, approved }: BudgetLinesFormProps) => {
  const { form, state, isPending, onSubmit } = useBudgetLinesForm(action, lines);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel={approved ? "Save revision" : "Save lines"}>
      <LinesField
        name="lines"
        label="Study lines"
        emptyRow={EMPTY_BUDGET_LINE}
        columns={[
          { name: "category", label: "Category", type: "select", span: 6, options: budgetCategories.map((c) => ({ value: c, label: BUDGET_CATEGORY_LABELS[c] })) },
          { name: "planned", label: "Planned (SAR)", type: "number", span: 5 },
        ]}
      />
      {approved && (
        <TextareaField name="reason" label="Reason for the change (required — the budget is approved)" placeholder="Why the approved figures change" />
      )}
    </ActionForm>
  );
};
