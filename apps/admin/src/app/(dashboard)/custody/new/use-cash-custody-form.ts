"use client";

import { useWatch } from "react-hook-form";
import { round2, sumBy } from "utils";
import { cashCustodySchema } from "validators";
import { useActionForm } from "@/lib/use-action-form";
import { createCashCustodyAction } from "./actions";

/** The running total of the lines shows under the form as they are typed. */
export const useCashCustodyForm = () => {
  const { form, state, isPending, onSubmit } = useActionForm(cashCustodySchema, createCashCustodyAction, {
    employeeName: "",
    projectUuid: "",
    budgetCategory: "manpower",
    city: "",
    workOrderNo: "",
    lines: [{ description: "", amount: 0 }],
  });
  const lines = useWatch({ control: form.control, name: "lines" });
  const total = round2(sumBy(lines ?? [], (l) => Number(l.amount) || 0));
  return { form, state, isPending, onSubmit, total };
};
