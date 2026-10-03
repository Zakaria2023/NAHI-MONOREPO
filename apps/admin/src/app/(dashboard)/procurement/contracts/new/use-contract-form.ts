"use client";

import { addDays, nowIso, toDateInput } from "utils";
import { supplierContractSchema } from "validators";
import { useActionForm } from "@/lib/use-action-form";
import { createContractAction } from "./actions";

export const useContractForm = () =>
  useActionForm(supplierContractSchema, createContractAction, {
    supplierUuid: "",
    title: "",
    startsAt: toDateInput(nowIso()),
    endsAt: toDateInput(addDays(nowIso(), 364)),
    deliveryDays: "14",
    paymentTermsDays: "45",
    latePenaltyPctPerDay: "0.5",
    latePenaltyCapPct: "10",
    lines: [{ itemUuid: "", unitPrice: "" }],
  });
