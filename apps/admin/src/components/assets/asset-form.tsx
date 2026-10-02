"use client";

import { DropdownOption } from "ui";
import { ASSET_CATEGORY_LABELS, ASSET_HOLDER_KIND_LABELS } from "@/db/label";
import { assetCategories, assetHolderKinds } from "@/db/enum";
import { useAssetForm } from "@/app/(dashboard)/finance/assets/use-asset-form";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { TextField } from "@/components/forms/text-field";

type AssetFormProps = {
  projects: DropdownOption[];
  warehouses: DropdownOption[];
};

export const AssetForm = ({ projects, warehouses }: AssetFormProps) => {
  const { form, state, isPending, onSubmit, employeeHeld } = useAssetForm();
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Register asset" columns={3}>
      <TextField name="name" label="Asset" placeholder="Fujikura 90S fusion splicer" required />
      <DropdownField name="category" label="Category" options={assetCategories.map((c) => ({ value: c, label: ASSET_CATEGORY_LABELS[c] }))} />
      <TextField name="serialNumber" label="Serial number" required />
      <TextField name="purchaseDate" label="Purchased" type="date" required />
      <TextField name="cost" label="Cost (SAR, excl. VAT)" type="number" required />
      <TextField name="salvageValue" label="Salvage value (SAR)" type="number" />
      <TextField name="usefulLifeMonths" label="Useful life (months)" type="number" />
      <DropdownField name="projectUuid" label="Depreciation charged to" options={projects} />
      <div />
      <DropdownField name="holderKind" label="Kept" options={assetHolderKinds.map((k) => ({ value: k, label: ASSET_HOLDER_KIND_LABELS[k] }))} />
      {employeeHeld ? (
        <TextField name="employeeName" label="Held by" placeholder="Employee name" />
      ) : (
        <DropdownField name="warehouseUuid" label="Warehouse" options={warehouses} placeholder="Pick a warehouse" />
      )}
    </ActionForm>
  );
};
