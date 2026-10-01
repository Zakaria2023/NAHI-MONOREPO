"use server";

import {
  cancelPurchaseOrder,
  decidePurchaseOrder,
  evaluateSupplier,
  receiveGoods,
  recordAdvancePayment,
  sendPurchaseOrder,
} from "services";
import {
  advancePaymentSchema,
  cancelPurchaseOrderSchema,
  decisionSchema,
  goodsReceiptSchema,
  supplierEvaluationSchema,
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
