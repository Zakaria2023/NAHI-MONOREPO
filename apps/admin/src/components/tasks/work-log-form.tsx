"use client";

import { useWorkLogForm } from "@/app/(dashboard)/tasks/[uuid]/use-work-log-form";
import { ActionForm } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/text-field";
import { FormAction } from "@/lib/action-result";

type WorkLogFormProps = {
  action: FormAction;
};

export const WorkLogForm = ({ action }: WorkLogFormProps) => {
  const { form, state, isPending, onSubmit } = useWorkLogForm(action);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Log work" columns={3}>
      <TextField name="date" label="Day worked" type="date" required />
      <TextField name="hours" label="Hours" type="number" step="0.5" required />
      <TextField name="note" label="What was done" placeholder="Optional" />
    </ActionForm>
  );
};
