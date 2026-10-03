"use client";

import { advancePaymentSchema, cancelPurchaseOrderSchema, penaltyTermsSchema, supplierEvaluationSchema } from "validators";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";

// The small forms of the purchase order page, each in a dialog, one hook each.
// They take the action already bound to the PO, because the page binds it.

export const useEvaluationForm = (action: FormAction) =>
  useActionForm(supplierEvaluationSchema, action, { quality: "4", onTime: "4", price: "4", note: "" });

export const useCancelOrderForm = (action: FormAction) => useActionForm(cancelPurchaseOrderSchema, action, { note: "" });

export const useAdvancePaymentForm = (action: FormAction) => useActionForm(advancePaymentSchema, action, { amount: "" });

export const usePenaltyTermsForm = (action: FormAction, pctPerDay: number, capPct: number) =>
  useActionForm(penaltyTermsSchema, action, { latePenaltyPctPerDay: pctPerDay, latePenaltyCapPct: capPct });
