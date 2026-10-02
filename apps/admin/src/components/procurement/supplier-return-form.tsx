"use client";

import { DropdownOption } from "ui";
import { SUPPLIER_RETURN_REMEDY_LABELS } from "@/db/label";
import { supplierReturnRemedies } from "@/db/enum";
import { useSupplierReturnForm } from "@/app/(dashboard)/procurement/orders/[uuid]/use-order-forms";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { TextField } from "@/components/forms/text-field";
import { FormAction } from "@/lib/action-result";

type SupplierReturnFormProps = {
  action: FormAction;
  warehouses: DropdownOption[];
  items: DropdownOption[];
};

export const SupplierReturnForm = ({ action, warehouses, items }: SupplierReturnFormProps) => {
  const { form, state, isPending, onSubmit } = useSupplierReturnForm(action, warehouses[0]?.value ?? "", items[0]?.value ?? "");
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Return to supplier" submitVariant="outline" columns={2}>
      <DropdownField name="itemUuid" label="Item" options={items} />
      <DropdownField name="warehouseUuid" label="From warehouse" options={warehouses} />
      <TextField name="qty" label="Quantity" type="number" />
      <DropdownField
        name="remedy"
        label="Remedy"
        options={supplierReturnRemedies.map((r) => ({ value: r, label: SUPPLIER_RETURN_REMEDY_LABELS[r] }))}
      />
      <div className="md:col-span-2">
        <TextField name="reason" label="Reason" placeholder="Damaged reel, wrong specification…" />
      </div>
    </ActionForm>
  );
};
