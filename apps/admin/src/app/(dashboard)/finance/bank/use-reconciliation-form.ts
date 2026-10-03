"use client";

import { reconciliationSchema } from "validators";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";

/** Takes the action bound to the account; the month is fixed by the page. */
export const useReconciliationForm = (action: FormAction, period: string) =>
  useActionForm(reconciliationSchema, action, { period, statementBalance: "" });
