"use client";

import { nowIso, toDateInput } from "utils";
import { attendanceSchema } from "validators";
import { useActionForm } from "@/lib/use-action-form";
import { recordAttendanceAction } from "./actions";

export const useAttendanceForm = () =>
  useActionForm(attendanceSchema, recordAttendanceAction, {
    employeeUuid: "",
    date: toDateInput(nowIso()),
    projectUuid: "",
    hours: "8",
  });
