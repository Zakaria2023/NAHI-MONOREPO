"use server";

import { redirect } from "next/navigation";
import { createPayrollRun } from "services";
import { payrollRunSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const createPayrollRunAction = async (_prev: ActionResult, data: unknown): Promise<ActionResult> => {
  let created = "";
  const result = await runAction(
    data,
    async (actor, input) => {
      created = (await createPayrollRun(actor, input)).uuid;
    },
    { schema: payrollRunSchema },
  );
  if (result.error) {
    return result;
  }
  redirect(`/payroll/runs/${created}`);
};
