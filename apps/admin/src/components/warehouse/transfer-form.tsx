"use client";

import { DropdownOption } from "ui";
import { useTransferForm } from "@/app/(dashboard)/warehouse/transfers/new/use-transfer-form";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { LinesField } from "@/components/forms/lines-field";

type TransferFormProps = {
  warehouses: DropdownOption[];
  items: DropdownOption[];
};

export const TransferForm = ({ warehouses, items }: TransferFormProps) => {
  const { form, state, isPending, onSubmit } = useTransferForm();
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Request transfer" columns={2}>
      <DropdownField name="fromWarehouseUuid" label="From warehouse" required options={warehouses} />
      <DropdownField name="toWarehouseUuid" label="To warehouse" required options={warehouses} />
      <LinesField
        name="lines"
        label="Items"
        emptyRow={{ itemUuid: "", qty: 1 }}
        columns={[
          { name: "itemUuid", label: "Item", type: "select", options: items, span: 6 },
          { name: "qty", label: "Quantity", type: "number", span: 5 },
        ]}
      />
    </ActionForm>
  );
};
