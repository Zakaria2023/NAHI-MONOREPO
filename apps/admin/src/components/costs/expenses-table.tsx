import { ExpenseRow } from "services";
import { Table } from "ui";
import { formatDate, formatMoney } from "utils";
import { BUDGET_CATEGORY_LABELS, EXPENSE_CATEGORY_LABELS } from "@/db/label";

type ExpensesTableProps = {
  expenses: ExpenseRow[];
};

export const ExpensesTable = ({ expenses }: ExpensesTableProps) => (
  <Table
    data={expenses}
    rowKey={(e) => e.uuid}
    emptyMessage="No manual expenses recorded."
    columns={[
      {
        key: "number",
        header: "Expense",
        render: (e) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">{e.description}</span>
            <span dir="ltr" className="text-xs text-muted">
              {e.number} · {formatDate(e.date)}
            </span>
          </div>
        ),
      },
      { key: "category", header: "Category", render: (e) => <span className="text-secondary">{EXPENSE_CATEGORY_LABELS[e.category]}</span> },
      { key: "budget", header: "Budget line", render: (e) => BUDGET_CATEGORY_LABELS[e.budgetCategory] },
      {
        key: "split",
        header: "Cost centres",
        wrap: true,
        render: (e) => (
          <span dir="ltr" className="text-secondary">
            {e.allocationsView.map((a) => `${a.code} ${formatMoney(a.amount)}`).join(" · ")}
          </span>
        ),
      },
      { key: "vat", header: "VAT", align: "end", render: (e) => (e.vat > 0 ? formatMoney(e.vat) : "—") },
      { key: "amount", header: "Amount", align: "end", render: (e) => <span className="font-medium">{formatMoney(e.amount)}</span> },
    ]}
  />
);
