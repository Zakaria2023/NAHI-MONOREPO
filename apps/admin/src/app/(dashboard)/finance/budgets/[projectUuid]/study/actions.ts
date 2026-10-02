"use server";

import { addScheduleItem, addStudyLine, applyStudyToBudget, removeScheduleItem, removeStudyLine } from "services";
import { applyStudySchema, scheduleItemSchema, studyLineSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

// Bound to the project (and the line) in the study components.

export const addStudyLineAction = async (projectUuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => addStudyLine(actor, projectUuid, input), { schema: studyLineSchema, success: "Line added" });

export const removeStudyLineAction = async (projectUuid: string, lineUuid: string) =>
  runAction(undefined, (actor) => removeStudyLine(actor, projectUuid, lineUuid), { success: "Line removed" });

export const addScheduleItemAction = async (projectUuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => addScheduleItem(actor, projectUuid, input), { schema: scheduleItemSchema, success: "Timeline row added" });

export const removeScheduleItemAction = async (projectUuid: string, itemUuid: string) =>
  runAction(undefined, (actor) => removeScheduleItem(actor, projectUuid, itemUuid), { success: "Timeline row removed" });

export const applyStudyAction = async (projectUuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => applyStudyToBudget(actor, projectUuid, input), { schema: applyStudySchema, success: "Study applied to the budget" });
