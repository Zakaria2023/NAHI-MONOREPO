"use client";

import { formatMoney } from "utils";
import { useSettleForm } from "@/app/(dashboard)/custody/[uuid]/use-settle-form";
import { ActionForm } from "@/components/forms/action-form";
import { TextareaField } from "@/components/forms/textarea-field";
import { TextField } from "@/components/forms/text-field";
import { FormAction } from "@/lib/action-result";

type SettleFormProps = {
  action: FormAction;
  amount: number;
};

export const SettleForm = ({ action, amount }: SettleFormProps) => {
  const { form, state, isPending, onSubmit, returned } = useSettleForm(action, amount);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Settle custody" columns={2} submitVariant="success">
      <TextField name="spent" label="Spent, against receipts (SAR)" type="number" required />
      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-secondary">Returned to the cash box</span>
        <span className={`rounded-control border border-hairline-soft bg-hover px-3 py-2 text-sm ${returned < 0 ? "text-danger" : "text-ink"}`}>
          {returned < 0 ? `Spent exceeds the custody by ${formatMoney(-returned)}` : formatMoney(returned)}
        </span>
      </div>
      <div className="md:col-span-2">
        <TextareaField name="note" label="Note" placeholder="Receipts attached, remarks" />
      </div>
    </ActionForm>
  );
};
