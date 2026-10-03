"use client";

import { taskChecklistItemSchema } from "validators";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";

/** Each opening of the dialog starts with an empty field. */
export const useChecklistItemForm = (action: FormAction) => useActionForm(taskChecklistItemSchema, action, { text: "" });
