"use server";

import { recordStatementCheck } from "services";
import { statementCheckSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

/** Bound to its supplier in the page (`action.bind(null, supplierUuid)`). */
export const statementCheckAction = async (supplierUuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => recordStatementCheck(actor, supplierUuid, input), { schema: statementCheckSchema, success: "Statement checked" });
