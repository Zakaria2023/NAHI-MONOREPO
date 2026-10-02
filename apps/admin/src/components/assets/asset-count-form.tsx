"use client";

import { useAssetCountForm } from "@/app/(dashboard)/finance/assets/[uuid]/use-asset-forms";
import { ActionForm } from "@/components/forms/action-form";
import { CheckboxField } from "@/components/forms/checkbox-field";
import { TextField } from "@/components/forms/text-field";
import { FormAction } from "@/lib/action-result";

type AssetCountFormProps = {
  action: FormAction;
};

export const AssetCountForm = ({ action }: AssetCountFormProps) => {
  const { form, state, isPending, onSubmit } = useAssetCountForm(action);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Record count" submitVariant="outline">
      <CheckboxField name="found" label="Found where the register says" />
      <TextField name="condition" label="Condition" placeholder="Good, in use" />
    </ActionForm>
  );
};
