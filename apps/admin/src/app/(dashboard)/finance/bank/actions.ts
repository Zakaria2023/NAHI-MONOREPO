"use server";

import { createBankAccount, reconcileBankAccount } from "services";
import { bankAccountSchema, reconciliationSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const createBankAccountAction = async (_prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => createBankAccount(actor, input), { schema: bankAccountSchema, success: "Account added" });

/** Bound to its account in the page (`action.bind(null, accountUuid)`). */
export const reconcileAction = async (accountUuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => reconcileBankAccount(actor, accountUuid, input), { schema: reconciliationSchema, success: "Reconciled" });
