"use client";

import { useItemForm } from "@/app/(dashboard)/warehouse/stock/use-item-form";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { TextField } from "@/components/forms/text-field";
import { itemCategories, itemKinds } from "@/db/enum";
import { ITEM_CATEGORY_LABELS, ITEM_KIND_LABELS } from "@/db/label";

export const ItemForm = () => {
  const { form, state, isPending, onSubmit } = useItemForm();
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Add item" columns={3}>
      <TextField name="code" label="Code" required placeholder="FIB-144" />
      <TextField name="name" label="Name" required />
      <TextField name="unit" label="Unit" required placeholder="m, pcs, roll" />
      <DropdownField name="category" label="Category" required options={itemCategories.map((c) => ({ value: c, label: ITEM_CATEGORY_LABELS[c] }))} />
      <DropdownField
        name="kind"
        label="Kind"
        required
        options={itemKinds.map((k) => ({
          value: k,
          label: ITEM_KIND_LABELS[k],
          hint: k === "fixed_asset" ? "Issued as custody to an employee, counted periodically" : "Used up on the project",
        }))}
      />
      <TextField name="reorderLevel" label="Reorder level" type="number" />
      <TextField name="standardCost" label="Standard cost (SAR)" type="number" />
    </ActionForm>
  );
};
