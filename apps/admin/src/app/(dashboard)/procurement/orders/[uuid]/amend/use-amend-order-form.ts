"use client";

import { amendPurchaseOrderSchema } from "validators";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";

type PricedLineDefault = {
  itemUuid: string;
  qty: number;
  unitPrice: number;
};

/** Starts from the PO as it stands. */
export const useAmendOrderForm = (action: FormAction, lines: PricedLineDefault[], deliveryDays: number) =>
  useActionForm(amendPurchaseOrderSchema, action, { lines, deliveryDays, note: "" });
