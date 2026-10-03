"use server";

import { redirect } from "next/navigation";
import { createBankAccount } from "services";
import { bankAccountSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const createBankAccountAction = async (_prev: ActionResult, data: unknown): Promise<ActionResult> => {
  const result = await runAction(data, (actor, input) => createBankAccount(actor, input), { schema: bankAccountSchema });
  if (result.error) {
    return result;
  }
  redirect("/finance/bank");
};
