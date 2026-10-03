"use client";

import { DropdownOption } from "ui";
import { useReassignForm } from "@/app/(dashboard)/tasks/[uuid]/use-reassign-form";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { TextField } from "@/components/forms/text-field";
import { FormAction } from "@/lib/action-result";

type TaskReassignFormProps = {
  action: FormAction;
  staff: DropdownOption[];
};

export const TaskReassignForm = ({ action, staff }: TaskReassignFormProps) => {
  const { form, state, isPending, onSubmit } = useReassignForm(action);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Reassign" submitVariant="outline" columns={2}>
      <DropdownField name="assigneeUuid" label="Give it to" required options={staff} placeholder="Pick a staff member" />
      <TextField name="note" label="Why" placeholder="Optional" />
    </ActionForm>
  );
};
