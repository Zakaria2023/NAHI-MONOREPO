"use client";

import { transferSchema } from "validators";
import { useActionForm } from "@/lib/use-action-form";
import { createTransferAction } from "./actions";

export const useTransferForm = () =>
  useActionForm(transferSchema, createTransferAction, {
    fromWarehouseUuid: "",
    toWarehouseUuid: "",
    lines: [{ itemUuid: "", qty: 1 }],
  });
