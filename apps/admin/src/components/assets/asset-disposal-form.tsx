"use client";

import { ASSET_DISPOSAL_KIND_LABELS } from "@/db/label";
import { assetDisposalKinds } from "@/db/enum";
import { useAssetDisposalForm } from "@/app/(dashboard)/finance/assets/[uuid]/use-asset-forms";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { TextField } from "@/components/forms/text-field";
import { FormAction } from "@/lib/action-result";

type AssetDisposalFormProps = {
  action: FormAction;
};

export const AssetDisposalForm = ({ action }: AssetDisposalFormProps) => {
  const { form, state, isPending, onSubmit } = useAssetDisposalForm(action);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Take off the books" submitVariant="outline" columns={2}>
      <DropdownField name="kind" label="How" options={assetDisposalKinds.map((k) => ({ value: k, label: ASSET_DISPOSAL_KIND_LABELS[k] }))} />
      <TextField name="disposedAt" label="Date" type="date" />
      <TextField name="proceeds" label="Proceeds (SAR)" type="number" />
      <TextField name="note" label="Note" />
    </ActionForm>
  );
};
