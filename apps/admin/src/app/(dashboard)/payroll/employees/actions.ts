"use server";

import { createEmployee, createEmployeeLogin } from "services";
import { employeeLoginSchema, employeeSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const createEmployeeAction = async (_prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => createEmployee(actor, input), { schema: employeeSchema, success: "Employee added" });

export const createEmployeeLoginAction = async (_prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => createEmployeeLogin(actor, input), { schema: employeeLoginSchema, success: "Sign-in created — they can sign in now" });
