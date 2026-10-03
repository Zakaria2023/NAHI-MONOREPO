"use server";

import { approveBudget } from "services";
import { runAction } from "@/lib/server/run-action";

// Bound to the project in the detail component (`action.bind(null, projectUuid)`).

export const approveBudgetAction = async (projectUuid: string) =>
  runAction(undefined, (actor) => approveBudget(actor, projectUuid), { success: "Budget approved" });
