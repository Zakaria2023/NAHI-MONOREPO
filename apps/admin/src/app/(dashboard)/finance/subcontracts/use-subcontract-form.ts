"use client";

import { subcontractSchema } from "validators";
import { useActionForm } from "@/lib/use-action-form";
import { createSubcontractAction } from "./actions";

export const useSubcontractForm = () =>
  useActionForm(subcontractSchema, createSubcontractAction, {
    subcontractorUuid: "",
    projectUuid: "",
    scope: "",
    budgetCategory: "civil_works",
    value: 0,
    retentionPct: 10,
    advancePaid: 0,
  });
