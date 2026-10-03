"use server";

import { approveSupplierInvoice } from "services";
import { runAction } from "@/lib/server/run-action";

// Bound to the invoice in the detail component (`action.bind(null, uuid)`).

export const approveSupplierInvoiceAction = async (uuid: string) =>
  runAction(undefined, (actor) => approveSupplierInvoice(actor, uuid), { success: "Approved — added to the due schedule" });
