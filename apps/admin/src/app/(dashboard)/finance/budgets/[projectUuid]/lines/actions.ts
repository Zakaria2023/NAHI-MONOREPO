"use server";

import { redirect } from "next/navigation";
import { saveBudgetLines } from "services";
import { budgetLinesSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

/** Bound to the project in the form's page (`action.bind(null, projectUuid)`). */
export const saveBudgetLinesAction = async (projectUuid: string, _prev: ActionResult, data: unknown): Promise<ActionResult> => {
  const result = await runAction(data, (actor, input) => saveBudgetLines(actor, projectUuid, input), { schema: budgetLinesSchema });
  if (result.error) {
    return result;
  }
  redirect(`/finance/budgets/${projectUuid}`);
};
