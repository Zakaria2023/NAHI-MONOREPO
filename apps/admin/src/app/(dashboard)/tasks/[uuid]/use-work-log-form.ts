"use client";

import { nowIso, toDateInput } from "utils";
import { taskWorkLogSchema } from "validators";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";

/** Today's work by default; each opening of the dialog starts fresh. */
export const useWorkLogForm = (action: FormAction) =>
  useActionForm(taskWorkLogSchema, action, {
    date: toDateInput(nowIso()),
    hours: "",
    note: "",
  });
