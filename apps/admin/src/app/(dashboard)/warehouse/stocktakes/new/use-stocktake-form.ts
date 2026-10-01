"use client";

import { nowIso, toDateInput } from "utils";
import { stocktakeSchema } from "validators";
import { useActionForm } from "@/lib/use-action-form";
import { createStocktakeAction } from "./actions";

export const useStocktakeForm = () =>
  useActionForm(stocktakeSchema, createStocktakeAction, {
    warehouseUuid: "",
    countedAt: toDateInput(nowIso()),
    lines: [{ itemUuid: "", actualQty: 0 }],
  });
