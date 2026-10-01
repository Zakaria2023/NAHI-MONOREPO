"use server";

import { redirect } from "next/navigation";
import { createPurchaseRequest } from "services";
import { purchaseRequestSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const createPurchaseRequestAction = async (_prev: ActionResult, data: unknown): Promise<ActionResult> => {
  let created = "";
  const result = await runAction(
    data,
    async (actor, input) => {
      created = (await createPurchaseRequest(actor, input)).uuid;
    },
    { schema: purchaseRequestSchema },
  );
  if (result.error) {
    return result;
  }
  redirect(`/procurement/requests/${created}`);
};
