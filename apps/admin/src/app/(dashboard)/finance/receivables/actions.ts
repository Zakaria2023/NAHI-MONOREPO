"use server";

import { createAsBuiltInvoice, recordCustomerCollection } from "services";
import { asBuiltInvoiceSchema, collectionSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const issueAsBuiltInvoiceAction = async (_prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => createAsBuiltInvoice(actor, input), { schema: asBuiltInvoiceSchema, success: "Tax invoice issued" });

/** Bound to the invoice in its table row. */
export const collectCustomerInvoiceAction = async (invoiceUuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => recordCustomerCollection(actor, invoiceUuid, input), { schema: collectionSchema, success: "Collection recorded" });
