import Link from "next/link";
import { listBudgets } from "services";
import { Table } from "ui";
import { formatMoney, formatPercent, round2 } from "utils";
import { OperatorPill } from "@/components/shared/operator-pill";
import { ProgressBar } from "@/components/shared/progress-bar";
import { BudgetStatusPill } from "./budget-status-pill";

export type BudgetFilter = "all" | "draft" | "approved" | "overrun";

type BudgetsTableProps = {
  filter: BudgetFilter;
};

export const BudgetsTable = async ({ filter }: BudgetsTableProps) => {
  const budgets = (await listBudgets()).filter((b) =>
    filter === "all"
      ? true
      : filter === "overrun"
        ? b.usage.some((l) => l.remaining < 0)
        : filter === "draft"
          ? b.budget?.status !== "approved"
          : b.budget?.status === "approved",
  );
  return (
    <Table
      data={budgets}
      rowKey={(b) => b.project.uuid}
      emptyMessage="No project in this view."
      columns={[
        {
          key: "project",
          header: "Project",
          render: (b) => (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Link href={`/finance/budgets/${b.project.uuid}`} dir="ltr" className="font-medium after:absolute after:inset-0 hover:text-primary">
                  {b.project.code}
                </Link>
                <OperatorPill operator={b.project.operator} />
              </div>
              <span className="line-clamp-1 text-xs text-muted">{b.project.name}</span>
            </div>
          ),
        },
        { key: "planned", header: "Planned", align: "end", render: (b) => formatMoney(b.totals.planned) },
        { key: "reserved", header: "Reserved", align: "end", render: (b) => formatMoney(b.totals.reserved) },
        { key: "committed", header: "Committed", align: "end", render: (b) => formatMoney(b.totals.committed) },
        { key: "spent", header: "Spent", align: "end", render: (b) => formatMoney(b.totals.spent) },
        {
          key: "remaining",
          header: "Remaining",
          align: "end",
          render: (b) => <span className={b.totals.remaining < 0 ? "font-medium text-danger" : ""}>{formatMoney(b.totals.remaining)}</span>,
        },
        { key: "status", header: "Status", render: (b) => <BudgetStatusPill budget={b.budget} /> },
        {
          key: "consumed",
          header: "Consumed",
          render: (b) => {
            const consumed = b.totals.planned > 0 ? round2(b.totals.planned - b.totals.remaining) / b.totals.planned : 0;
            return (
              <div className="flex w-36 flex-col gap-1.5">
                <span className={`text-xs ${consumed > 1 ? "text-danger" : "text-muted"}`}>{formatPercent(consumed)}</span>
                <ProgressBar value={consumed} />
              </div>
            );
          },
        },
      ]}
    />
  );
};
