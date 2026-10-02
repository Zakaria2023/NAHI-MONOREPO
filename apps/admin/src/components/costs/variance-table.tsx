import { StudyCategoryRow } from "services";
import { Table } from "ui";
import { formatMoney, formatPercent } from "utils";
import { BUDGET_CATEGORY_LABELS } from "@/db/label";
import { ProgressBar } from "@/components/shared/progress-bar";

type VarianceTableProps = {
  categories: StudyCategoryRow[];
};

export const VarianceTable = ({ categories }: VarianceTableProps) => (
  <Table
    data={categories}
    rowKey={(c) => c.category}
    emptyMessage="Nothing planned or spent yet."
    columns={[
      { key: "category", header: "Category", render: (c) => <span className="font-medium">{BUDGET_CATEGORY_LABELS[c.category]}</span> },
      { key: "study", header: "Study", align: "end", render: (c) => formatMoney(c.study) },
      { key: "budget", header: "Budget", align: "end", render: (c) => formatMoney(c.budgeted) },
      { key: "actual", header: "Actual", align: "end", render: (c) => formatMoney(c.actual) },
      {
        key: "variance",
        header: "Variance",
        align: "end",
        render: (c) => <span className={c.variance < 0 ? "text-danger" : "text-success"}>{formatMoney(c.variance)}</span>,
      },
      { key: "committed", header: "Committed", align: "end", render: (c) => formatMoney(c.committed) },
      {
        key: "used",
        header: "Used",
        render: (c) =>
          c.usedRatio === null ? (
            <span className="text-muted">Not in the study</span>
          ) : (
            <div className="flex w-36 flex-col gap-1">
              <span className={`text-xs ${c.usedRatio > 1 ? "text-danger" : "text-muted"}`}>{formatPercent(c.usedRatio)}</span>
              <ProgressBar value={c.usedRatio} />
            </div>
          ),
      },
    ]}
  />
);
