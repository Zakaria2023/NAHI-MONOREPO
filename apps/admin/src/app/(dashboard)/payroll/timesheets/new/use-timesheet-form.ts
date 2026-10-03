"use client";

import { timesheetSchema } from "validators";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";

export const useTimesheetForm = (action: FormAction, period: string) =>
  useActionForm(timesheetSchema, action, {
    employeeUuid: "",
    period,
    absentDays: "0",
    overtimeHours: "0",
    allocations: [{ projectUuid: "", days: "" }],
  });
