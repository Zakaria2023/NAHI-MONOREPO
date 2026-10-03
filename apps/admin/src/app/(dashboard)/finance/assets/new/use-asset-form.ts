"use client";

import { nowIso, toDateInput } from "utils";
import { fixedAssetSchema } from "validators";
import { useActionForm } from "@/lib/use-action-form";
import { registerAssetAction } from "./actions";

export const useAssetForm = () => {
  const props = useActionForm(fixedAssetSchema, registerAssetAction, {
    name: "",
    category: "test_equipment",
    serialNumber: "",
    purchaseDate: toDateInput(nowIso()),
    cost: "",
    salvageValue: "0",
    usefulLifeMonths: "60",
    projectUuid: "",
    holderKind: "warehouse",
    warehouseUuid: "",
    employeeName: "",
  });
  // A warehouse to pick, or an employee to name.
  const employeeHeld = props.form.watch("holderKind") === "employee";
  return { ...props, employeeHeld };
};
