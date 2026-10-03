"use client";

import { DropdownOption } from "ui";
import { useAmendOrderForm } from "@/app/(dashboard)/procurement/orders/[uuid]/amend/use-amend-order-form";
import { ActionForm } from "@/components/forms/action-form";
import { LinesField } from "@/components/forms/lines-field";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { FormAction } from "@/lib/action-result";

type AmendOrderFormProps = {
  action: FormAction;
  lines: { itemUuid: string; qty: number; unitPrice: number }[];
  deliveryDays: number;
  items: DropdownOption[];
};

export const AmendOrderForm = ({ action, lines, deliveryDays, items }: AmendOrderFormProps) => {
  const { form, state, isPending, onSubmit } = useAmendOrderForm(action, lines, deliveryDays);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Modify and resubmit" submitVariant="outline" columns={2}>
      <LinesField
        name="lines"
        label="Lines"
        fixed
        emptyRow={{ itemUuid: "", qty: "", unitPrice: "" }}
        columns={[
          { name: "itemUuid", label: "Item", type: "select", options: items, span: 6 },
          { name: "qty", label: "Quantity", type: "number", span: 3 },
          { name: "unitPrice", label: "Unit price (SAR)", type: "number", span: 3 },
        ]}
      />
      <TextField name="deliveryDays" label="Delivery (days)" type="number" />
      <div />
      <div className="md:col-span-2">
        <TextareaField name="note" label="Reason" placeholder="Kept in the PO's change log" />
      </div>
    </ActionForm>
  );
};
