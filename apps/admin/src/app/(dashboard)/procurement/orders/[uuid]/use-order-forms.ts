"use client";

import { nowIso, toDateInput } from "utils";
import {
  advancePaymentSchema,
  cancelPurchaseOrderSchema,
  goodsReceiptSchema,
  supplierEvaluationSchema,
} from "validators";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";

// The forms of the purchase order page, one hook each. They take the action
// already bound to the PO, because the page (a server component) binds it.

type ReceiptLineDefault = {
  itemUuid: string;
  receivedQty: number;
  acceptedQty: number;
  rejectionReason: string;
};

export const useGoodsReceiptForm = (action: FormAction, warehouseUuid: string, lines: ReceiptLineDefault[]) =>
  useActionForm(goodsReceiptSchema, action, { warehouseUuid, receivedAt: toDateInput(nowIso()), lines });

export const useEvaluationForm = (action: FormAction) =>
  useActionForm(supplierEvaluationSchema, action, { quality: "4", onTime: "4", price: "4", note: "" });

export const useCancelOrderForm = (action: FormAction) => useActionForm(cancelPurchaseOrderSchema, action, { note: "" });

export const useAdvancePaymentForm = (action: FormAction) => useActionForm(advancePaymentSchema, action, { amount: "" });
