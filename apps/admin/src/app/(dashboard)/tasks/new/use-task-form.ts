"use client";

import { nowIso, toDateInput } from "utils";
import { taskSchema } from "validators";
import { useActionForm } from "@/lib/use-action-form";
import { createTaskAction } from "./actions";

/** A new task, due today unless changed, with one empty checklist line to start from. */
export const useTaskForm = (assigneeUuid: string) =>
  useActionForm(taskSchema, createTaskAction, {
    title: "",
    description: "",
    assigneeUuid,
    priority: "normal",
    dueDate: toDateInput(nowIso()),
    projectUuid: "",
    checklist: [{ text: "" }],
  });
