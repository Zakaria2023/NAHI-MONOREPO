"use client";

import { taskReassignSchema } from "validators";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";

export const useReassignForm = (action: FormAction) => useActionForm(taskReassignSchema, action, { assigneeUuid: "", note: "" });
