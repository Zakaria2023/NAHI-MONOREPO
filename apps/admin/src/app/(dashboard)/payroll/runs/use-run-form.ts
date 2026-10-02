"use client";

import { payrollRunSchema } from "validators";
import { useActionForm } from "@/lib/use-action-form";
import { createPayrollRunAction } from "./actions";

export const useRunForm = (period: string) => useActionForm(payrollRunSchema, createPayrollRunAction, { period });
