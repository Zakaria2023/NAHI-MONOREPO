"use server";

import { decidePayrollRun, payPayrollRun, recalculatePayrollRun } from "services";
import { decisionSchema, payrollPaymentSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

// Every action here is bound to its payroll run in the page (`action.bind(null, uuid)`).

export const decideRunAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => decidePayrollRun(actor, uuid, input), { schema: decisionSchema, success: "Decision recorded" });

export const recalculateRunAction = async (uuid: string) =>
  runAction(undefined, (actor) => recalculatePayrollRun(actor, uuid), { success: "Recalculated" });

export const payRunAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => payPayrollRun(actor, uuid, input), { schema: payrollPaymentSchema, success: "Salaries paid" });
