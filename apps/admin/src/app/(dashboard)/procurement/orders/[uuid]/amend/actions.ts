"use server";

import { redirect } from "next/navigation";
import { amendPurchaseOrder } from "services";
import { amendPurchaseOrderSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const amendOrderAction = async (uuid: string, _prev: ActionResult, data: unknown): Promise<ActionResult> => {
  const result = await runAction(data, (actor, input) => amendPurchaseOrder(actor, uuid, input), { schema: amendPurchaseOrderSchema });
  if (result.error) {
    return result;
  }
  redirect(`/procurement/orders/${uuid}`);
};
