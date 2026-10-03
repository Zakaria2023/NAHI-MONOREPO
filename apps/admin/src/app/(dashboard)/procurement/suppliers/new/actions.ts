"use server";

import { redirect } from "next/navigation";
import { createSupplier } from "services";
import { supplierSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const createSupplierAction = async (_prev: ActionResult, data: unknown): Promise<ActionResult> => {
  const result = await runAction(data, (actor, input) => createSupplier(actor, input), { schema: supplierSchema });
  if (result.error) {
    return result;
  }
  redirect("/procurement/suppliers");
};
