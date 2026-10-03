"use server";

import { redirect } from "next/navigation";
import { saveTimesheet } from "services";
import { timesheetSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

/** Bound to the month, so it returns to that month's timesheets. */
export const saveTimesheetAction = async (period: string, _prev: ActionResult, data: unknown): Promise<ActionResult> => {
  const result = await runAction(data, (actor, input) => saveTimesheet(actor, input), { schema: timesheetSchema });
  if (result.error) {
    return result;
  }
  redirect(`/payroll/timesheets?period=${period}`);
};
