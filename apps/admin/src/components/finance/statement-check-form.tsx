"use client";

import { useStatementCheckForm } from "@/app/(dashboard)/finance/payables/statement/[supplierUuid]/use-statement-check-form";
import { ActionForm } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/text-field";
import { FormAction } from "@/lib/action-result";

type StatementCheckFormProps = {
  action: FormAction;
};

export const StatementCheckForm = ({ action }: StatementCheckFormProps) => {
  const { form, state, isPending, onSubmit } = useStatementCheckForm(action);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Match" submitVariant="outline" columns={2}>
      <TextField name="asOf" label="Their statement is dated" type="date" />
      <TextField name="reportedBalance" label="Balance they show (SAR)" type="number" />
      <div className="md:col-span-2">
        <TextField name="note" label="Note" placeholder="What explains a difference" />
      </div>
    </ActionForm>
  );
};
