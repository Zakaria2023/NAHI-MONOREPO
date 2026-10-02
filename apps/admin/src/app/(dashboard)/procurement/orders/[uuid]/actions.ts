"use server";

import {
  amendPurchaseOrder,
  cancelPurchaseOrder,
  decidePurchaseOrder,
  evaluateSupplier,
  receiveGoods,
  recordAdvancePayment,
  returnToSupplier,
  sendPurchaseOrder,
  setPenaltyTerms,
} from "services";
import {
  advancePaymentSchema,
  amendPurchaseOrderSchema,
  cancelPurchaseOrderSchema,
  decisionSchema,
  goodsReceiptSchema,
  penaltyTermsSchema,
  supplierEvaluationSchema,
  supplierReturnSchema,
} from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

// Every action here is bound to its purchase order in the page (`action.bind(null, uuid)`).

export const decideOrderAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => decidePurchaseOrder(actor, uuid, input), { schema: decisionSchema, success: "Decision recorded" });

export const sendOrderAction = async (uuid: string) =>
  runAction(undefined, (actor) => sendPurchaseOrder(actor, uuid), { success: "Sent to the supplier" });

export const receiveGoodsAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => receiveGoods(actor, uuid, input), { schema: goodsReceiptSchema, success: "Goods receipt posted" });

export const evaluateSupplierAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => evaluateSupplier(actor, uuid, input), { schema: supplierEvaluationSchema, success: "Supplier evaluated" });

export const cancelOrderAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => cancelPurchaseOrder(actor, uuid, input), { schema: cancelPurchaseOrderSchema, success: "PO cancelled" });

export const advancePaymentAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => recordAdvancePayment(actor, uuid, input), { schema: advancePaymentSchema, success: "Advance recorded" });

export const amendOrderAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => amendPurchaseOrder(actor, uuid, input), { schema: amendPurchaseOrderSchema, success: "PO modified — back for approval" });

export const penaltyTermsAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => setPenaltyTerms(actor, uuid, input), { schema: penaltyTermsSchema, success: "Penalty terms saved" });

export const returnToSupplierAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => returnToSupplier(actor, uuid, input), { schema: supplierReturnSchema, success: "Return recorded" });
