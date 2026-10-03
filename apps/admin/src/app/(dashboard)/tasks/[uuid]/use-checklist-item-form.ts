"use client";

import { useEffect } from "react";
import { taskChecklistItemSchema } from "validators";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";

/** The field empties once the item is added, ready for the next one. */
export const useChecklistItemForm = (action: FormAction) => {
  const { form, state, isPending, onSubmit } = useActionForm(taskChecklistItemSchema, action, { text: "" });
  const { reset } = form;
  useEffect(() => {
    if (state.success) {
      reset({ text: "" });
    }
  }, [state, reset]);
  return { form, state, isPending, onSubmit };
};
