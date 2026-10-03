"use server";

import { redirect } from "next/navigation";
import { returnToSupplier } from "services";
import { supplierReturnSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const returnToSupplierAction = async (uuid: string, _prev: ActionResult, data: unknown): Promise<ActionResult> => {
  const result = await runAction(data, (actor, input) => returnToSupplier(actor, uuid, input), { schema: supplierReturnSchema });
  if (result.error) {
    return result;
  }
  redirect(`/procurement/orders/${uuid}`);
};
