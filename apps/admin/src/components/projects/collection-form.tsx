"use client";

import { useCollectionForm } from "@/app/(dashboard)/projects/[uuid]/use-project-forms";
import { ActionForm } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/text-field";
import { FormAction } from "@/lib/action-result";

type CollectionFormProps = {
  action: FormAction;
};

export const CollectionForm = ({ action }: CollectionFormProps) => {
  const { form, state, isPending, onSubmit } = useCollectionForm(action);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Mark collected" layout="inline" submitVariant="success">
      <div className="w-40">
        <TextField name="paidAt" label="Collected on" type="date" />
      </div>
    </ActionForm>
  );
};
