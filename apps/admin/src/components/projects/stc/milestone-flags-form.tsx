"use client";

import { useMilestoneFlagsForm } from "@/app/(dashboard)/projects/[uuid]/use-project-forms";
import { ActionForm } from "@/components/forms/action-form";
import { CheckboxField } from "@/components/forms/checkbox-field";
import { FormAction } from "@/lib/action-result";

type MilestoneFlagsFormProps = {
  action: FormAction;
  qtyIncreased: boolean;
  newUpl: boolean;
};

export const MilestoneFlagsForm = ({ action, qtyIncreased, newUpl }: MilestoneFlagsFormProps) => {
  const { form, state, isPending, onSubmit } = useMilestoneFlagsForm(action, qtyIncreased, newUpl);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Save" layout="inline" submitVariant="outline">
      <div className="flex gap-5 pb-2">
        <CheckboxField name="qtyIncreased" label="Quantity increased" />
        <CheckboxField name="newUpl" label="New UPL added" />
      </div>
    </ActionForm>
  );
};
