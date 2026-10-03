"use server";

import { redirect } from "next/navigation";
import { createEmployee } from "services";
import { employeeSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const createEmployeeAction = async (_prev: ActionResult, data: unknown): Promise<ActionResult> => {
  const result = await runAction(data, (actor, input) => createEmployee(actor, input), { schema: employeeSchema });
  if (result.error) {
    return result;
  }
  redirect("/payroll/employees");
};
