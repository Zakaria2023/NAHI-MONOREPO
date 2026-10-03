"use server";

import { redirect } from "next/navigation";
import { createSubcontract } from "services";
import { subcontractSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const createSubcontractAction = async (_prev: ActionResult, data: unknown): Promise<ActionResult> => {
  const result = await runAction(data, (actor, input) => createSubcontract(actor, input), { schema: subcontractSchema });
  if (result.error) {
    return result;
  }
  redirect("/finance/subcontracts");
};
