"use client";

import { useChecklistItemForm } from "@/app/(dashboard)/tasks/[uuid]/use-checklist-item-form";
import { ActionForm } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/text-field";
import { FormAction } from "@/lib/action-result";

type ChecklistItemFormProps = {
  action: FormAction;
};

export const ChecklistItemForm = ({ action }: ChecklistItemFormProps) => {
  const { form, state, isPending, onSubmit } = useChecklistItemForm(action);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Add" layout="inline" submitVariant="outline">
      <div className="min-w-64 flex-1">
        <TextField name="text" label="New checklist item" placeholder="One more step" />
      </div>
    </ActionForm>
  );
};
