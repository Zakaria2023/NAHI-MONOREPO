"use client";

import { DropdownOption } from "ui";
import { useGoodsReceiptForm } from "@/app/(dashboard)/procurement/orders/[uuid]/use-order-forms";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { LinesField } from "@/components/forms/lines-field";
import { TextField } from "@/components/forms/text-field";
import { FormAction } from "@/lib/action-result";

type GoodsReceiptFormProps = {
  action: FormAction;
  warehouseOptions: DropdownOption[];
  itemOptions: DropdownOption[];
  /** The PO's outstanding lines, the full outstanding quantity filled in. */
  lines: { itemUuid: string; receivedQty: number; acceptedQty: number; rejectionReason: string }[];
};

export const GoodsReceiptForm = ({ action, warehouseOptions, itemOptions, lines }: GoodsReceiptFormProps) => {
  const { form, state, isPending, onSubmit } = useGoodsReceiptForm(action, warehouseOptions[0]?.value ?? "", lines);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Post goods receipt" columns={2} submitVariant="success">
      <DropdownField name="warehouseUuid" label="Receiving warehouse" required options={warehouseOptions} />
      <TextField name="receivedAt" label="Received on" type="date" required />
      <LinesField
        name="lines"
        label="Counted and checked against the PO"
        fixed
        emptyRow={{ itemUuid: "", receivedQty: 0, acceptedQty: 0, rejectionReason: "" }}
        columns={[
          { name: "itemUuid", label: "Item", type: "select", options: itemOptions, span: 4 },
          { name: "receivedQty", label: "Received", type: "number", span: 2 },
          { name: "acceptedQty", label: "Accepted", type: "number", span: 2 },
          { name: "rejectionReason", label: "Rejection reason", type: "text", span: 4 },
        ]}
      />
    </ActionForm>
  );
};
