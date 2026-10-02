"use client";

import { nowIso, toDateInput } from "utils";
import { assetCountSchema, assetDisposalSchema, assetTransferSchema } from "validators";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";

// The forms of the asset card, one hook each, taking the action already bound to the asset.

export const useAssetTransferForm = (action: FormAction) => {
  const props = useActionForm(assetTransferSchema, action, { holderKind: "employee", warehouseUuid: "", employeeName: "", note: "" });
  const employeeHeld = props.form.watch("holderKind") === "employee";
  return { ...props, employeeHeld };
};

export const useAssetCountForm = (action: FormAction) => useActionForm(assetCountSchema, action, { found: true, condition: "" });

export const useAssetDisposalForm = (action: FormAction) =>
  useActionForm(assetDisposalSchema, action, { kind: "sale", disposedAt: toDateInput(nowIso()), proceeds: "0", note: "" });
