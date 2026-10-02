"use client";

import { nowIso, toDateInput } from "utils";
import { attendanceSchema, timesheetSchema } from "validators";
import { useActionForm } from "@/lib/use-action-form";
import { recordAttendanceAction, saveTimesheetAction } from "./actions";

export const useTimesheetForm = (period: string) =>
  useActionForm(timesheetSchema, saveTimesheetAction, {
    employeeUuid: "",
    period,
    absentDays: "0",
    overtimeHours: "0",
    allocations: [{ projectUuid: "", days: "" }],
  });

export const useAttendanceForm = () =>
  useActionForm(attendanceSchema, recordAttendanceAction, {
    employeeUuid: "",
    date: toDateInput(nowIso()),
    projectUuid: "",
    hours: "8",
  });
