"use server";

import { redirect } from "next/navigation";
import { addQuotation } from "services";
import { quotationSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

// Bound to its purchase request in the page (`action.bind(null, uuid)`).

export const addQuotationAction = async (uuid: string, _prev: ActionResult, data: unknown): Promise<ActionResult> => {
  const result = await runAction(data, (actor, input) => addQuotation(actor, uuid, input), { schema: quotationSchema });
  if (result.error) {
    return result;
  }
  redirect(`/procurement/requests/${uuid}`);
};
