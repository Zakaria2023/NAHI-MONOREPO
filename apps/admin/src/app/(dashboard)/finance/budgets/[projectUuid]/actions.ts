"use server";

import { approveBudget, saveBudgetLines } from "services";
import { budgetLinesSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

// Bound to the project in the detail component (`action.bind(null, projectUuid)`).

export const saveBudgetLinesAction = async (projectUuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => saveBudgetLines(actor, projectUuid, input), { schema: budgetLinesSchema, success: "Budget lines saved" });

export const approveBudgetAction = async (projectUuid: string) =>
  runAction(undefined, (actor) => approveBudget(actor, projectUuid), { success: "Budget approved" });
