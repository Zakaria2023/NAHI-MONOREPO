import { z } from "zod";
import { taskPriorities } from "../../../db/enum";
import { dateField, optionalNote, requiredText } from "./common";

export const taskSchema = z.object({
  title: requiredText("Title"),
  description: z.string().trim().max(2000),
  assigneeUuid: z.string().min(1, "Pick who does it"),
  priority: z.enum(taskPriorities),
  dueDate: dateField,
  /** "" for a task that belongs to no project. */
  projectUuid: z.string(),
  checklist: z.array(z.object({ text: z.string().trim().max(200) })),
});

export type TaskInput = z.infer<typeof taskSchema>;

/** Holding, sending back and cancelling say why. */
export const taskReasonSchema = z.object({
  note: z.string().trim().min(1, "Write the reason").max(500),
});

export type TaskReasonInput = z.infer<typeof taskReasonSchema>;

/** Handing in and accepting may say something, and need not. */
export const taskNoteSchema = z.object({
  note: optionalNote,
});

export type TaskNoteInput = z.infer<typeof taskNoteSchema>;

export const taskReassignSchema = z.object({
  assigneeUuid: z.string().min(1, "Pick who takes it over"),
  note: optionalNote,
});

export type TaskReassignInput = z.infer<typeof taskReassignSchema>;

export const taskWorkLogSchema = z.object({
  date: dateField,
  hours: z.coerce.number<string | number>().positive("Enter the hours worked").max(24, "No more than 24 hours in a day"),
  note: optionalNote,
});

export type TaskWorkLogInput = z.infer<typeof taskWorkLogSchema>;

export const taskCommentSchema = z.object({
  text: z.string().trim().min(1, "Write a comment").max(1000),
});

export type TaskCommentInput = z.infer<typeof taskCommentSchema>;

export const taskChecklistItemSchema = z.object({
  text: requiredText("Item"),
});

export type TaskChecklistItemInput = z.infer<typeof taskChecklistItemSchema>;
