"use client";

import { DropdownOption } from "ui";
import { useTaskForm } from "@/app/(dashboard)/tasks/new/use-task-form";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { LinesField } from "@/components/forms/lines-field";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { taskPriorities } from "@/db/enum";
import { TASK_PRIORITY_LABELS } from "@/db/label";

type TaskFormProps = {
  staff: DropdownOption[];
  projects: DropdownOption[];
  /** Pre-selected assignee, from `?to=` on the link that opened the form. */
  assigneeUuid: string;
};

export const TaskForm = ({ staff, projects, assigneeUuid }: TaskFormProps) => {
  const { form, state, isPending, onSubmit } = useTaskForm(assigneeUuid);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Give task" columns={2}>
      <div className="md:col-span-2">
        <TextField name="title" label="Task" placeholder="What has to be done" required />
      </div>
      <div className="md:col-span-2">
        <TextareaField name="description" label="Details" placeholder="What done looks like, where, anything they need to know" />
      </div>
      <DropdownField name="assigneeUuid" label="Assigned to" required options={staff} placeholder="Pick a staff member" />
      <DropdownField name="priority" label="Priority" required options={taskPriorities.map((p) => ({ value: p, label: TASK_PRIORITY_LABELS[p] }))} />
      <TextField name="dueDate" label="Due date" type="date" required />
      <DropdownField name="projectUuid" label="Project" options={[{ value: "", label: "No project" }, ...projects]} placeholder="No project" />
      <LinesField name="checklist" label="Checklist — every line must be ticked before the task can be handed in" emptyRow={{ text: "" }} columns={[{ name: "text", label: "Step", type: "text", span: 6 }]} />
    </ActionForm>
  );
};
