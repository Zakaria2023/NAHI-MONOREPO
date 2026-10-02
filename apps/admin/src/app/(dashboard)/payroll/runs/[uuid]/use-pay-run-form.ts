"use client";

import { payrollPaymentSchema } from "validators";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";

export const usePayRunForm = (action: FormAction) => useActionForm(payrollPaymentSchema, action, { bankReference: "" });
