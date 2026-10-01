"use server";

import {
  addQuotation,
  decidePurchaseRequest,
  decideQuotation,
  decideStockSupply,
  reviewPurchaseRequest,
  submitQuotationForApproval,
} from "services";
import { decisionSchema, procurementReviewSchema, quotationSchema, selectQuotationSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

// Every action here is bound to its purchase request in the page (`action.bind(null, uuid)`).

export const decideRequestAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => decidePurchaseRequest(actor, uuid, input), { schema: decisionSchema, success: "Decision recorded" });

/** Procurement's finding, bound with `true` (supply from stock) or `false` (purchase). */
export const reviewRequestAction = async (uuid: string, stockAvailable: boolean) =>
  runAction({ stockAvailable }, (actor, input) => reviewPurchaseRequest(actor, uuid, input), {
    schema: procurementReviewSchema,
    success: stockAvailable ? "Sent for stock supply approval" : "Quotations requested",
  });

export const decideStockSupplyAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => decideStockSupply(actor, uuid, input), { schema: decisionSchema, success: "Decision recorded" });

export const addQuotationAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => addQuotation(actor, uuid, input), { schema: quotationSchema, success: "Quotation recorded" });

export const submitQuotationAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => submitQuotationForApproval(actor, uuid, input), {
    schema: selectQuotationSchema,
    success: "Quotation submitted for approval",
  });

export const decideQuotationAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => decideQuotation(actor, uuid, input), { schema: decisionSchema, success: "Decision recorded" });
