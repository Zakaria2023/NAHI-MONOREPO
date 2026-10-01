"use server";

import { redirect } from "next/navigation";
import { registerSupplierInvoice } from "services";
import { supplierInvoiceSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const registerSupplierInvoiceAction = async (_prev: ActionResult, data: unknown): Promise<ActionResult> => {
  let created = "";
  const result = await runAction(
    data,
    async (actor, input) => {
      created = (await registerSupplierInvoice(actor, input)).uuid;
    },
    { schema: supplierInvoiceSchema },
  );
  if (result.error) {
    return result;
  }
  redirect(`/finance/payables/${created}`);
};
