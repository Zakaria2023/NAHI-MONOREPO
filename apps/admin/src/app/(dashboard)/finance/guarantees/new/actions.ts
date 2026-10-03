"use server";

import { redirect } from "next/navigation";
import { createGuarantee } from "services";
import { guaranteeSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const createGuaranteeAction = async (_prev: ActionResult, data: unknown): Promise<ActionResult> => {
  const result = await runAction(data, (actor, input) => createGuarantee(actor, input), { schema: guaranteeSchema });
  if (result.error) {
    return result;
  }
  redirect("/finance/guarantees");
};
