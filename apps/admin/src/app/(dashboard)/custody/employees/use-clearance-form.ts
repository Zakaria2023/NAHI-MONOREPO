"use client";

import { clearanceSchema } from "validators";
import { useActionForm } from "@/lib/use-action-form";
import { approveClearanceAction } from "./actions";

export const useClearanceForm = (employeeName: string) =>
  useActionForm(clearanceSchema, approveClearanceAction, { employeeName, reason: "resignation" });
