"use client";

import { useTaskNoteForm } from "@/app/(dashboard)/tasks/[uuid]/use-task-note-form";
import { ActionForm } from "@/components/forms/action-form";
import { TextareaField } from "@/components/forms/textarea-field";
import { FormAction } from "@/lib/action-result";

type TaskNoteFormProps = {
  action: FormAction;
  submitLabel: string;
  label: string;
  placeholder?: string;
  /** A reason that must be given (hold, send back, cancel). */
  required?: boolean;
  variant?: "primary" | "outline" | "success";
};

/** A move on the task with a note beside it — handing in, accepting, sending back. */
export const TaskNoteForm = ({ action, submitLabel, label, placeholder, required = false, variant = "primary" }: TaskNoteFormProps) => {
  const { form, state, isPending, onSubmit } = useTaskNoteForm(action, required);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel={submitLabel} submitVariant={variant}>
      <TextareaField name="note" label={required ? `${label} (required)` : label} placeholder={placeholder} />
    </ActionForm>
  );
};
