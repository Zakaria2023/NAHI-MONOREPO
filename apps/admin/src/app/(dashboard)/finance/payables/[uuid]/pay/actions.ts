"use server";

import { redirect } from "next/navigation";
import { recordSupplierPayment } from "services";
import { paymentSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const recordSupplierPaymentAction = async (uuid: string, _prev: ActionResult, data: unknown): Promise<ActionResult> => {
  const result = await runAction(data, (actor, input) => recordSupplierPayment(actor, uuid, input), { schema: paymentSchema });
  if (result.error) {
    return result;
  }
  redirect(`/finance/payables/${uuid}`);
};
