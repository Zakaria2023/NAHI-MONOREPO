"use client";

import { orderUnderContractSchema, selectQuotationSchema } from "validators";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";

// The dialog forms of the purchase request page, one hook each. They take the
// action already bound to the request, because the page (a server component) binds it.

export const useSelectQuotationForm = (action: FormAction, quotationUuid: string) =>
  useActionForm(selectQuotationSchema, action, { quotationUuid });

export const useContractOrderForm = (action: FormAction, contractUuid: string) =>
  useActionForm(orderUnderContractSchema, action, { contractUuid });
