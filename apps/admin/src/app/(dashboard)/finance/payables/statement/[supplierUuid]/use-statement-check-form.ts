"use client";

import { nowIso, toDateInput } from "utils";
import { statementCheckSchema } from "validators";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";

export const useStatementCheckForm = (action: FormAction) =>
  useActionForm(statementCheckSchema, action, { asOf: toDateInput(nowIso()), reportedBalance: "", note: "" });
