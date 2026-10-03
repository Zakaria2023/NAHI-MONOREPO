"use client";

import { DropdownOption } from "ui";
import { useTimesheetForm } from "@/app/(dashboard)/payroll/timesheets/new/use-timesheet-form";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { LinesField } from "@/components/forms/lines-field";
import { TextField } from "@/components/forms/text-field";
import { FormAction } from "@/lib/action-result";

type TimesheetFormProps = {
  /** Bound to the month. */
  action: FormAction;
  period: string;
  employees: DropdownOption[];
  projects: DropdownOption[];
};

export const TimesheetForm = ({ action, period, employees, projects }: TimesheetFormProps) => {
  const { form, state, isPending, onSubmit } = useTimesheetForm(action, period);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Save timesheet" columns={3}>
      <div className="md:col-span-3">
        <DropdownField name="employeeUuid" label="Employee" options={employees} placeholder="Pick an employee" required />
      </div>
      <TextField name="absentDays" label="Days absent" type="number" />
      <TextField name="overtimeHours" label="Overtime hours" type="number" />
      <div />
      <LinesField
        name="allocations"
        label="Days worked per project"
        emptyRow={{ projectUuid: "", days: "" }}
        columns={[
          { name: "projectUuid", label: "Project", type: "select", options: projects, span: 6 },
          { name: "days", label: "Days", type: "number", span: 3 },
        ]}
      />
    </ActionForm>
  );
};
