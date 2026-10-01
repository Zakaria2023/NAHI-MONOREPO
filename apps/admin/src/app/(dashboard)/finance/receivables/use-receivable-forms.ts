"use client";

import { nowIso, toDateInput } from "utils";
import { asBuiltInvoiceSchema, collectionSchema } from "validators";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";
import { issueAsBuiltInvoiceAction } from "./actions";

const today = () => toDateInput(nowIso());

export const useAsBuiltInvoiceForm = () =>
  useActionForm(asBuiltInvoiceSchema, issueAsBuiltInvoiceAction, {
    projectUuid: "",
    amount: 0,
    submittedAt: today(),
    paymentTermsDays: 60,
  });

/** Takes the action already bound to the invoice. */
export const useInvoiceCollectionForm = (action: FormAction) => useActionForm(collectionSchema, action, { paidAt: today() });
