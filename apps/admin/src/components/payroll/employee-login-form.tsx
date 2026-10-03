"use client";

import { DropdownOption } from "ui";
import { useEmployeeLoginForm } from "@/app/(dashboard)/payroll/employees/use-employee-login-form";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { TextField } from "@/components/forms/text-field";

type EmployeeLoginFormProps = {
  /** Employees who have no sign-in yet. */
  employees: DropdownOption[];
};

export const EmployeeLoginForm = ({ employees }: EmployeeLoginFormProps) => {
  const { form, state, isPending, onSubmit } = useEmployeeLoginForm();
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Create sign-in" columns={3}>
      <DropdownField name="employeeUuid" label="Employee" required options={employees} placeholder="Pick an employee" />
      <TextField name="email" label="E-mail" type="email" placeholder="name@example.sa" required />
      <TextField name="password" label="Password" type="password" placeholder="At least 8 characters" required />
    </ActionForm>
  );
};
