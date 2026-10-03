"use client";

import { nowIso, toDateInput } from "utils";
import { bankAccountSchema } from "validators";
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
