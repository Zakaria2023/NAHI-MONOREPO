"use client";

import { taskCommentSchema } from "validators";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";

/** Each opening of the dialog starts with an empty box. */
export const useCommentForm = (action: FormAction) => useActionForm(taskCommentSchema, action, { text: "" });
