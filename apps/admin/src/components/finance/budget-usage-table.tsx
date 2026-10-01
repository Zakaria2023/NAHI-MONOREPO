import { BudgetUsageLine, BudgetView } from "services";
import { Table } from "ui";
import { formatMoney } from "utils";
import { BUDGET_CATEGORY_LABELS } from "@/db/label";

type BudgetUsageTableProps = {
  usage: BudgetUsageLine[];
  totals: BudgetView["totals"];
};

type UsageRow = Omit<BudgetUsageLine, "category"> & {
  key: string;
  label: string;
  isTotal: boolean;
};

const AMOUNTS: { key: keyof Omit<BudgetUsageLine, "category" | "remaining">; header: string }[] = [
  { key: "planned", header: "Planned" },
  { key: "reserved", header: "Reserved" },
  { key: "committed", header: "Committed" },
  { key: "spent", header: "Spent" },
  { key: "actual", header: "Actual cost" },
];

/** Finance §4 budget vs actual, one row per study line and a totals row. */
export const BudgetUsageTable = ({ usage, totals }: BudgetUsageTableProps) => {
  const rows: UsageRow[] = [
    ...usage.map((line) => ({ ...line, key: line.category, label: BUDGET_CATEGORY_LABELS[line.category], isTotal: false })),
    { ...totals, key: "total", label: "Total", isTotal: true },
  ];
  return (
    <Table
      data={rows}
      rowKey={(r) => r.key}
      columns={[
        { key: "label", header: "Category", render: (r) => <span className={r.isTotal ? "font-medium" : ""}>{r.label}</span> },
        ...AMOUNTS.map((amount) => ({
          key: amount.key,
          header: amount.header,
          align: "end" as const,
          render: (r: UsageRow) =>
            r[amount.key] === 0 && !r.isTotal ? (
              <span className="text-faint">—</span>
            ) : (
              <span className={r.isTotal ? "font-medium" : ""}>{formatMoney(r[amount.key])}</span>
            ),
        })),
        {
          key: "remaining",
          header: "Remaining",
          align: "end",
          render: (r) => (
            <span className={`${r.remaining < 0 ? "text-danger" : ""} ${r.isTotal || r.remaining < 0 ? "font-medium" : ""}`}>{formatMoney(r.remaining)}</span>
          ),
        },
      ]}
    />
  );
};
