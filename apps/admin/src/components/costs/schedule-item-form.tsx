"use client";

import { STUDY_RESOURCE_LABELS } from "@/db/label";
import { studyResources } from "@/db/enum";
import { useScheduleItemForm } from "@/app/(dashboard)/finance/budgets/[projectUuid]/study/use-study-forms";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { TextField } from "@/components/forms/text-field";
import { FormAction } from "@/lib/action-result";

type ScheduleItemFormProps = {
  action: FormAction;
};

export const ScheduleItemForm = ({ action }: ScheduleItemFormProps) => {
  const { form, state, isPending, onSubmit } = useScheduleItemForm(action);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Add row" submitVariant="outline" columns={2}>
      <DropdownField name="resource" label="Resource" options={studyResources.map((r) => ({ value: r, label: STUDY_RESOURCE_LABELS[r] }))} />
      <TextField name="description" label="What" placeholder="Civil crew, duct delivery…" />
      <TextField name="startsAt" label="From" type="date" />
      <TextField name="endsAt" label="Until" type="date" />
    </ActionForm>
  );
};
