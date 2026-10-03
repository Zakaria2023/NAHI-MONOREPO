"use client";

import { nowIso, toDateInput } from "utils";
import { employeeSchema } from "validators";
import { useActionForm } from "@/lib/use-action-form";
import { createEmployeeAction } from "./actions";

export const useEmployeeForm = () => {
  const props = useActionForm(employeeSchema, createEmployeeAction, {
    name: "",
    jobTitle: "",
    nationality: "non_saudi",
    employmentType: "monthly",
    basicSalary: "",
    housingAllowance: "",
    transportAllowance: "",
    dailyRate: "0",
    iban: "",
    bankName: "",
    defaultProjectUuid: "",
    joinedAt: toDateInput(nowIso()),
    accountEmail: "",
  });
  // Which pay fields the form shows: a salary and allowances, or a daily rate.
  const daily = props.form.watch("employmentType") === "daily";
  return { ...props, daily };
};
