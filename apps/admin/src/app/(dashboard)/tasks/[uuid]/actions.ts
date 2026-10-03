"use server";

import {
  addTaskChecklistItem,
  approveTask,
  cancelTask,
  commentOnTask,
  holdTask,
  logTaskWork,
  markTaskSeen,
  reassignTask,
  resumeTask,
  returnTask,
  startTask,
  submitTask,
  toggleTaskChecklistItem,
} from "services";
import {
  taskChecklistItemSchema,
  taskCommentSchema,
  taskNoteSchema,
  taskReasonSchema,
  taskReassignSchema,
  taskWorkLogSchema,
} from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

// Bound to the task in the page (`action.bind(null, uuid)`).

export const markTaskSeenAction = async (uuid: string) => runAction(undefined, (actor) => markTaskSeen(actor, uuid), { success: "Seen" });

export const startTaskAction = async (uuid: string) => runAction(undefined, (actor) => startTask(actor, uuid), { success: "Work started" });

export const resumeTaskAction = async (uuid: string) => runAction(undefined, (actor) => resumeTask(actor, uuid), { success: "Work resumed" });

export const holdTaskAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => holdTask(actor, uuid, input), { schema: taskReasonSchema, success: "Put on hold" });

export const submitTaskAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => submitTask(actor, uuid, input), { schema: taskNoteSchema, success: "Handed in for review" });

export const approveTaskAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => approveTask(actor, uuid, input), { schema: taskNoteSchema, success: "Accepted as done" });

export const returnTaskAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => returnTask(actor, uuid, input), { schema: taskReasonSchema, success: "Sent back" });

export const cancelTaskAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => cancelTask(actor, uuid, input), { schema: taskReasonSchema, success: "Task cancelled" });

export const reassignTaskAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => reassignTask(actor, uuid, input), { schema: taskReassignSchema, success: "Reassigned" });

export const logTaskWorkAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => logTaskWork(actor, uuid, input), { schema: taskWorkLogSchema, success: "Work logged" });

export const toggleChecklistItemAction = async (uuid: string, itemUuid: string) =>
  runAction(undefined, (actor) => toggleTaskChecklistItem(actor, uuid, itemUuid), { success: "Updated" });

export const addChecklistItemAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => addTaskChecklistItem(actor, uuid, input), { schema: taskChecklistItemSchema, success: "Item added" });

export const commentOnTaskAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => commentOnTask(actor, uuid, input), { schema: taskCommentSchema, success: "Comment added" });
