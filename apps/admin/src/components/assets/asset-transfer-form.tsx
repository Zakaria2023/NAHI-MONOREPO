"use client";

import { DropdownOption } from "ui";
import { ASSET_HOLDER_KIND_LABELS } from "@/db/label";
import { assetHolderKinds } from "@/db/enum";
import { useAssetTransferForm } from "@/app/(dashboard)/finance/assets/[uuid]/use-asset-forms";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { TextField } from "@/components/forms/text-field";
import { FormAction } from "@/lib/action-result";

type AssetTransferFormProps = {
  action: FormAction;
  warehouses: DropdownOption[];
};

export const AssetTransferForm = ({ action, warehouses }: AssetTransferFormProps) => {
  const { form, state, isPending, onSubmit, employeeHeld } = useAssetTransferForm(action);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Move asset" submitVariant="outline">
      <DropdownField name="holderKind" label="To" options={assetHolderKinds.map((k) => ({ value: k, label: ASSET_HOLDER_KIND_LABELS[k] }))} />
      {employeeHeld ? (
        <TextField name="employeeName" label="Employee" placeholder="Who takes it" />
      ) : (
        <DropdownField name="warehouseUuid" label="Warehouse" options={warehouses} placeholder="Pick a warehouse" />
      )}
      <TextField name="note" label="Note" placeholder="Why it moves" />
    </ActionForm>
  );
};
