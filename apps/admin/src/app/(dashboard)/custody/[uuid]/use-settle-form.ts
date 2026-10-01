"use client";

import { useWatch } from "react-hook-form";
import { round2 } from "utils";
import { settleCustodySchema } from "validators";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";

/** What comes back to the cash box is shown as the spent amount is typed. */
export const useSettleForm = (action: FormAction, amount: number) => {
  const { form, state, isPending, onSubmit } = useActionForm(settleCustodySchema, action, { spent: amount, note: "" });
  const spent = useWatch({ control: form.control, name: "spent" });
  const returned = round2(amount - (Number(spent) || 0));
  return { form, state, isPending, onSubmit, returned };
};
