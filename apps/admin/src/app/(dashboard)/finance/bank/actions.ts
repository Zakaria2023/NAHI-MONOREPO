"use server";

import { reconcileBankAccount } from "services";
import { reconciliationSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

/** Bound to its account in the page (`action.bind(null, accountUuid)`). */
export const reconcileAction = async (accountUuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => reconcileBankAccount(actor, accountUuid, input), { schema: reconciliationSchema, success: "Reconciled" });
