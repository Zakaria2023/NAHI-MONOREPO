"use client";

import { nowIso, toDateInput } from "utils";
import { expenseSchema } from "validators";
import { useActionForm } from "@/lib/use-action-form";
import { recordExpenseAction } from "./actions";

export const useExpenseForm = () => {
  const props = useActionForm(expenseSchema, recordExpenseAction, {
    date: toDateInput(nowIso()),
    description: "",
    category: "office",
    budgetCategory: "overhead",
    amount: "",
    vat: "0",
    allocations: [{ costCenterUuid: "", amount: "" }],
  });
  // A vehicle expense must be split over exactly two cost centres — the form says so up front.
  const vehicle = props.form.watch("category") === "vehicle";
  return { ...props, vehicle };
};
