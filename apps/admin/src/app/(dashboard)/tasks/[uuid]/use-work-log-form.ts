"use client";

import { useEffect } from "react";
import { nowIso, toDateInput } from "utils";
import { taskWorkLogSchema } from "validators";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";

/** Today's work by default; the hours and note clear once it is logged. */
export const useWorkLogForm = (action: FormAction) => {
  const { form, state, isPending, onSubmit } = useActionForm(taskWorkLogSchema, action, {
    date: toDateInput(nowIso()),
    hours: "",
    note: "",
  });
  const { reset, getValues } = form;
  useEffect(() => {
    if (state.success) {
      reset({ date: getValues("date"), hours: "", note: "" });
    }
  }, [state, reset, getValues]);
  return { form, state, isPending, onSubmit };
};
