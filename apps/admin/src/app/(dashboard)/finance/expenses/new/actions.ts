"use server";

import { redirect } from "next/navigation";
import { recordExpense } from "services";
import { expenseSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const recordExpenseAction = async (_prev: ActionResult, data: unknown): Promise<ActionResult> => {
  const result = await runAction(data, (actor, input) => recordExpense(actor, input), { schema: expenseSchema });
  if (result.error) {
    return result;
  }
  redirect("/finance/expenses");
};
