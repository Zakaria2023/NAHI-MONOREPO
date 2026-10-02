"use server";

import { createEmployee } from "services";
import { employeeSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const createEmployeeAction = async (_prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => createEmployee(actor, input), { schema: employeeSchema, success: "Employee added" });
