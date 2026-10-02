"use client";

import { addDays, nowIso, toDateInput } from "utils";
import { applyStudySchema, scheduleItemSchema, studyLineSchema } from "validators";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";

// The forms of the budget study, one hook each, taking the action already bound to the project.

export const useStudyLineForm = (action: FormAction) => {
  const props = useActionForm(studyLineSchema, action, {
    category: "civil_works",
    description: "",
    unit: "",
    qty: "",
    unitCost: "",
    duration: "0",
    supplyType: "",
    workType: "",
  });
  // Equipment carries how it is supplied; the works carry civil or fiber.
  const category = props.form.watch("category");
  return { ...props, equipment: category === "equipment", works: ["civil_works", "fiber_works", "equipment"].includes(category) };
};

export const useScheduleItemForm = (action: FormAction) =>
  useActionForm(scheduleItemSchema, action, {
    resource: "materials",
    description: "",
    startsAt: toDateInput(nowIso()),
    endsAt: toDateInput(addDays(nowIso(), 14)),
  });

export const useApplyStudyForm = (action: FormAction) => useActionForm(applyStudySchema, action, { reason: "" });
