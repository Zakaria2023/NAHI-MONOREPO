"use client";

import { DropdownOption } from "ui";
import { useAttendanceForm } from "@/app/(dashboard)/payroll/timesheets/use-timesheet-forms";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { TextField } from "@/components/forms/text-field";

type AttendanceFormProps = {
  workers: DropdownOption[];
  projects: DropdownOption[];
};

export const AttendanceForm = ({ workers, projects }: AttendanceFormProps) => {
  const { form, state, isPending, onSubmit } = useAttendanceForm();
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Record day" submitVariant="outline" columns={2}>
      <DropdownField name="employeeUuid" label="Worker" options={workers} placeholder="Pick a worker" />
      <DropdownField name="projectUuid" label="Site" options={projects} placeholder="Pick the site" />
      <TextField name="date" label="Day" type="date" />
      <TextField name="hours" label="Hours" type="number" />
    </ActionForm>
  );
};
