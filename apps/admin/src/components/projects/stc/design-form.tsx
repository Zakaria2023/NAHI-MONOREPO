"use client";

import { useDesignForm } from "@/app/(dashboard)/projects/[uuid]/use-project-forms";
import { ActionForm } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/text-field";
import { FormAction } from "@/lib/action-result";

type DesignFormProps = {
  action: FormAction;
};

export const DesignForm = ({ action }: DesignFormProps) => {
  const { form, state, isPending, onSubmit } = useDesignForm(action);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Record design approval">
      <TextField name="designClosedAt" label="Closed in ISOW" type="date" />
      <TextField name="designEndDate" label="End Date (STC approval)" type="datetime-local" />
    </ActionForm>
  );
};
