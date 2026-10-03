"use client";

import { supplierReturnSchema } from "validators";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";

export const useSupplierReturnForm = (action: FormAction, warehouseUuid: string, itemUuid: string) =>
  useActionForm(supplierReturnSchema, action, { warehouseUuid, itemUuid, qty: "", reason: "", remedy: "debit_note" });
