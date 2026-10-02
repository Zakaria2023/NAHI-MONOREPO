"use client";

import { nowIso, toDateInput } from "utils";
import { bankAccountSchema, reconciliationSchema } from "validators";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";
import { createBankAccountAction } from "./actions";

export const useBankAccountForm = () =>
  useActionForm(bankAccountSchema, createBankAccountAction, {
    code: "",
    name: "",
    bank: "",
    iban: "",
    openingBalance: "0",
    openingDate: toDateInput(nowIso()),
  });

/** Takes the action bound to the account; the month is fixed by the page. */
export const useReconciliationForm = (action: FormAction, period: string) =>
  useActionForm(reconciliationSchema, action, { period, statementBalance: "" });
