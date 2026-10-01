"use client";

import { useWatch } from "react-hook-form";
import { nowIso, round2, sumBy, toDateInput } from "utils";
import { extractSchema } from "validators";
import { useActionForm } from "@/lib/use-action-form";
import { submitExtractAction } from "./actions";

export const EMPTY_EXTRACT_LINE = { description: "", unit: "", qty: 0, unitRate: 0 };

export const useExtractForm = () => {
  const today = toDateInput(nowIso());
  const { form, state, isPending, onSubmit } = useActionForm(extractSchema, submitExtractAction, {
    subcontractUuid: "",
    periodFrom: `${today.slice(0, 8)}01`,
    periodTo: today,
    lines: [EMPTY_EXTRACT_LINE],
  });
  const lines = useWatch({ control: form.control, name: "lines" }) ?? [];
  const gross = round2(sumBy(lines, (l) => (Number(l?.qty) || 0) * (Number(l?.unitRate) || 0)));
  return { form, state, isPending, onSubmit, gross };
};
