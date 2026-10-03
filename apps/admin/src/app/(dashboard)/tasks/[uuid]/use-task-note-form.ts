"use client";

import { TaskNoteInput, taskNoteSchema, taskReasonSchema } from "validators";
import { ZodType } from "zod";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";

/** One note field: required when it is a reason (hold, send back, cancel), optional otherwise. */
export const useTaskNoteForm = (action: FormAction, required: boolean) => {
  const schema: ZodType<TaskNoteInput, TaskNoteInput> = required ? taskReasonSchema : taskNoteSchema;
  return useActionForm(schema, action, { note: "" });
};
