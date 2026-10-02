"use server";

import { createCostCenter, recordExpense } from "services";
import { costCenterSchema, expenseSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const recordExpenseAction = async (_prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => recordExpense(actor, input), { schema: expenseSchema, success: "Expense recorded" });

export const createCostCenterAction = async (_prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => createCostCenter(actor, input), { schema: costCenterSchema, success: "Cost centre added" });
