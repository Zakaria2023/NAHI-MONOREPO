"use client";

import { orderUnderContractSchema, quotationSchema, selectQuotationSchema } from "validators";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";

// The forms of the purchase request page, one hook each. They take the action
// already bound to the request, because the page (a server component) binds it.

type QuotationLineDefault = {
  itemUuid: string;
  qty: number;
  unitPrice: number;
};

export const useQuotationForm = (action: FormAction, lines: QuotationLineDefault[]) =>
  useActionForm(quotationSchema, action, {
    supplierUuid: "",
    deliveryDays: 7,
    paymentTermsDays: 30,
    qualityScore: "4",
    previouslyApproved: false,
    lines,
  });

export const useSelectQuotationForm = (action: FormAction, quotationUuid: string) =>
  useActionForm(selectQuotationSchema, action, { quotationUuid });

export const useContractOrderForm = (action: FormAction, contractUuid: string) =>
  useActionForm(orderUnderContractSchema, action, { contractUuid });
