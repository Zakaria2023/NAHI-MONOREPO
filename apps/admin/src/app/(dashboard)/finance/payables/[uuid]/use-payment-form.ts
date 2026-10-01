"use client";

import { nowIso, toDateInput } from "utils";
import { paymentSchema } from "validators";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";

/** Starts at what is still outstanding — the usual payment settles the invoice. */
export const usePaymentForm = (action: FormAction, outstanding: number) =>
  useActionForm(paymentSchema, action, {
    method: "bank_transfer",
    reference: "",
    amount: outstanding,
    paidAt: toDateInput(nowIso()),
  });
