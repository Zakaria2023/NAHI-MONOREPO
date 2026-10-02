"use client";

import { nowIso, toDateInput } from "utils";
import {
  advancePaymentSchema,
  amendPurchaseOrderSchema,
  cancelPurchaseOrderSchema,
  goodsReceiptSchema,
  penaltyTermsSchema,
  supplierEvaluationSchema,
  supplierReturnSchema,
} from "validators";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";

// The forms of the purchase order page, one hook each. They take the action
// already bound to the PO, because the page (a server component) binds it.

type PricedLineDefault = {
  itemUuid: string;
  qty: number;
  unitPrice: number;
};

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

export const useAmendOrderForm = (action: FormAction, lines: PricedLineDefault[], deliveryDays: number) =>
  useActionForm(amendPurchaseOrderSchema, action, { lines, deliveryDays, note: "" });

export const usePenaltyTermsForm = (action: FormAction, pctPerDay: number, capPct: number) =>
  useActionForm(penaltyTermsSchema, action, { latePenaltyPctPerDay: pctPerDay, latePenaltyCapPct: capPct });

export const useSupplierReturnForm = (action: FormAction, warehouseUuid: string, itemUuid: string) =>
  useActionForm(supplierReturnSchema, action, { warehouseUuid, itemUuid, qty: "", reason: "", remedy: "debit_note" });
