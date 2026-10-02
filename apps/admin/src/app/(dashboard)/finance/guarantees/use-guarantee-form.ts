"use client";

import { addDays, nowIso, toDateInput } from "utils";
import { guaranteeSchema } from "validators";
import { useActionForm } from "@/lib/use-action-form";
import { createGuaranteeAction } from "./actions";

export const useGuaranteeForm = () =>
  useActionForm(guaranteeSchema, createGuaranteeAction, {
    number: "",
    bank: "",
    kind: "performance",
    beneficiary: "",
    projectUuid: "",
    amount: "",
    issuedAt: toDateInput(nowIso()),
    expiresAt: toDateInput(addDays(nowIso(), 365)),
    note: "",
  });
