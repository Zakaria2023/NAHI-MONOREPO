import { ProjectBudget } from "services";
import { StatusPill } from "ui";
import { BUDGET_STATUS_LABELS } from "@/db/label";

type BudgetStatusPillProps = {
  budget: ProjectBudget | null;
};

export const BudgetStatusPill = ({ budget }: BudgetStatusPillProps) =>
  budget ? (
    <StatusPill tone={budget.status === "approved" ? "success" : "warning"}>{BUDGET_STATUS_LABELS[budget.status]}</StatusPill>
  ) : (
    <StatusPill>Not planned</StatusPill>
  );
