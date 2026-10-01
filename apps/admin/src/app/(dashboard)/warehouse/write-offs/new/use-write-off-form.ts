"use client";

import { useWatch } from "react-hook-form";
import { writeOffSchema } from "validators";
import { useActionForm } from "@/lib/use-action-form";
import { createWriteOffAction } from "./actions";

/** The employee field shows only when the loss is charged to an employee. */
export const useWriteOffForm = () => {
  const { form, state, isPending, onSubmit } = useActionForm(writeOffSchema, createWriteOffAction, {
    warehouseUuid: "",
    reason: "damaged",
    investigation: "",
    decision: "write_off",
    chargedEmployee: "",
    lines: [{ itemUuid: "", qty: 1 }],
  });
  const decision = useWatch({ control: form.control, name: "decision" });
  return { form, state, isPending, onSubmit, decision };
};
