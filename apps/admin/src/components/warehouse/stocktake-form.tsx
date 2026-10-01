"use client";

import { DropdownOption } from "ui";
import { useStocktakeForm } from "@/app/(dashboard)/warehouse/stocktakes/new/use-stocktake-form";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { LinesField } from "@/components/forms/lines-field";
import { TextField } from "@/components/forms/text-field";

type StocktakeFormProps = {
  warehouses: DropdownOption[];
  items: DropdownOption[];
};

export const StocktakeForm = ({ warehouses, items }: StocktakeFormProps) => {
  const { form, state, isPending, onSubmit } = useStocktakeForm();
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Record stocktake" columns={2}>
      <DropdownField name="warehouseUuid" label="Warehouse" required options={warehouses} />
      <TextField name="countedAt" label="Counted on" type="date" required />
      <LinesField
        name="lines"
        label="Counted items"
        emptyRow={{ itemUuid: "", actualQty: 0 }}
        columns={[
          { name: "itemUuid", label: "Item", type: "select", options: items, span: 6 },
          { name: "actualQty", label: "Actual quantity on the shelf", type: "number", span: 5 },
        ]}
      />
    </ActionForm>
  );
};
