"use client";

import { budgetLinesSchema } from "validators";
import { BudgetCategory } from "@/db/enum";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";

type PlannedLine = {
  category: BudgetCategory;
  planned: number;
};

export const EMPTY_BUDGET_LINE = { category: "civil_works", planned: 0 };

export const useBudgetLinesForm = (action: FormAction, lines: PlannedLine[]) =>
  useActionForm(budgetLinesSchema, action, { lines, reason: "" });
