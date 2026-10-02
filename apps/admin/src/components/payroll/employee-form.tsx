"use client";

import { DropdownOption } from "ui";
import { EMPLOYMENT_TYPE_LABELS, NATIONALITY_LABELS } from "@/db/label";
import { employmentTypes, nationalities } from "@/db/enum";
import { useEmployeeForm } from "@/app/(dashboard)/payroll/employees/use-employee-form";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { TextField } from "@/components/forms/text-field";

type EmployeeFormProps = {
  projects: DropdownOption[];
};

export const EmployeeForm = ({ projects }: EmployeeFormProps) => {
  const { form, state, isPending, onSubmit, daily } = useEmployeeForm();
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Add employee" columns={3}>
      <TextField name="name" label="Name" required />
      <TextField name="jobTitle" label="Job title" required />
      <TextField name="joinedAt" label="Joined" type="date" required />
      <DropdownField
        name="nationality"
        label="Nationality"
        options={nationalities.map((n) => ({ value: n, label: NATIONALITY_LABELS[n] }))}
      />
      <DropdownField
        name="employmentType"
        label="Paid"
        options={employmentTypes.map((t) => ({ value: t, label: EMPLOYMENT_TYPE_LABELS[t] }))}
      />
      <DropdownField name="defaultProjectUuid" label="Default project" options={projects} />
      {daily ? (
        <TextField name="dailyRate" label="Daily rate (SAR)" type="number" required />
      ) : (
        <>
          <TextField name="basicSalary" label="Basic salary (SAR)" type="number" required />
          <TextField name="housingAllowance" label="Housing allowance" type="number" />
          <TextField name="transportAllowance" label="Transport allowance" type="number" />
        </>
      )}
      <TextField name="iban" label="IBAN" placeholder="SA00 0000 0000 0000 0000 0000" required />
      <TextField name="bankName" label="Bank" required />
    </ActionForm>
  );
};
