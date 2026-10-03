"use client";

import { useEffect } from "react";
import { taskCommentSchema } from "validators";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";

/** The box empties once the comment is posted. */
export const useCommentForm = (action: FormAction) => {
  const { form, state, isPending, onSubmit } = useActionForm(taskCommentSchema, action, { text: "" });
  const { reset } = form;
  useEffect(() => {
    if (state.success) {
      reset({ text: "" });
    }
  }, [state, reset]);
  return { form, state, isPending, onSubmit };
};
