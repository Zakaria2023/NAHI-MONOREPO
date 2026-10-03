"use client";

import { quotationSchema } from "validators";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";

type QuotationLineDefault = {
  itemUuid: string;
  qty: number;
  unitPrice: number;
};

/** Takes the action already bound to the request, because the page (a server component) binds it. */
export const useQuotationForm = (action: FormAction, lines: QuotationLineDefault[]) =>
  useActionForm(quotationSchema, action, {
    supplierUuid: "",
    deliveryDays: 7,
    paymentTermsDays: 30,
    qualityScore: "4",
    previouslyApproved: false,
    lines,
  });
