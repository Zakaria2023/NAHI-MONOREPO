"use client";

import { useInspectorForm } from "@/app/(dashboard)/projects/[uuid]/use-project-forms";
import { ActionForm } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/text-field";
import { FormAction } from "@/lib/action-result";

type InspectorFormProps = {
  action: FormAction;
};

export const InspectorForm = ({ action }: InspectorFormProps) => {
  const { form, state, isPending, onSubmit } = useInspectorForm(action);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Record assignment">
      <TextField name="inspectorName" label="Inspector assigned by the Supervisor" placeholder="Eng. …" />
    </ActionForm>
  );
};
