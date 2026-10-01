"use client";

import { addDays, nowIso, toDateInput } from "utils";
import { purchaseRequestSchema } from "validators";
import { useActionForm } from "@/lib/use-action-form";
import { createPurchaseRequestAction } from "./actions";

/** A new PR starts with one empty line, expected in two weeks. */
export const useRequestForm = () => {
  const emptyLine = { itemUuid: "", qty: 1, estUnitPrice: 0, expectedDate: toDateInput(addDays(nowIso(), 14)) };
  const form = useActionForm(purchaseRequestSchema, createPurchaseRequestAction, {
    projectUuid: "",
    department: "",
    budgetCategory: "fiber_materials",
    note: "",
    lines: [emptyLine],
  });
  return { ...form, emptyLine };
};
