"use client";

import { nowIso, toDateInput } from "utils";
import { goodsReceiptSchema } from "validators";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";

type ReceiptLineDefault = {
  itemUuid: string;
  receivedQty: number;
  acceptedQty: number;
  rejectionReason: string;
};

/** Received today, every outstanding line filled in with its full quantity. */
export const useGoodsReceiptForm = (action: FormAction, warehouseUuid: string, lines: ReceiptLineDefault[]) =>
  useActionForm(goodsReceiptSchema, action, { warehouseUuid, receivedAt: toDateInput(nowIso()), lines });
