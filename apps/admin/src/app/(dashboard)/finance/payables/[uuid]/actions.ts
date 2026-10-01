"use server";

import { approveSupplierInvoice, recordSupplierPayment } from "services";
import { paymentSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

// Bound to the invoice in the detail component (`action.bind(null, uuid)`).

export const approveSupplierInvoiceAction = async (uuid: string) =>
  runAction(undefined, (actor) => approveSupplierInvoice(actor, uuid), { success: "Approved — added to the due schedule" });

export const recordSupplierPaymentAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => recordSupplierPayment(actor, uuid, input), {
    schema: paymentSchema,
    success: "Payment recorded — notice e-mailed to the supplier",
  });
