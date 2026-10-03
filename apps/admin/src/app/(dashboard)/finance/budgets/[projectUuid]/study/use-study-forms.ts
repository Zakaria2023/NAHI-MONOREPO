"use client";

import { addDays, nowIso, toDateInput } from "utils";
import { applyStudySchema, scheduleItemSchema } from "validators";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";

// The forms of the budget study, one hook each, taking the action already bound to the project.

export const useScheduleItemForm = (action: FormAction) =>
  useActionForm(scheduleItemSchema, action, {
    resource: "materials",
    description: "",
    startsAt: toDateInput(nowIso()),
    endsAt: toDateInput(addDays(nowIso(), 14)),
  });

export const useApplyStudyForm = (action: FormAction) => useActionForm(applyStudySchema, action, { reason: "" });
