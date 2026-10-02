import { Building2, Car, ReceiptText } from "lucide-react";
import { listCostCenters, listExpenses } from "services";
import { Card, StatStrip, StatTile } from "ui";
import { formatMoney, round2, sumBy } from "utils";
import { CsvButton } from "@/components/shared/csv-button";
import { CostCenterForm } from "./cost-center-form";
import { CostCentersTable } from "./cost-centers-table";
import { ExpenseForm } from "./expense-form";
import { ExpensesTable } from "./expenses-table";

export const ExpensesBoard = async () => {
  const [expenses, centres] = await Promise.all([listExpenses(), listCostCenters()]);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const projectCodes = new Set(centres.filter((c) => c.kind === "project").map((c) => c.code));
  const overheadShare = round2(sumBy(expenses.flatMap((e) => e.allocationsView), (a) => (projectCodes.has(a.code) ? 0 : a.amount)));
  return (
    <>
      <StatStrip columns="sm:grid-cols-3">
        <StatTile
          tone="primary"
          label="Expenses this month"
          value={formatMoney(round2(sumBy(expenses.filter((e) => e.date.slice(0, 7) === thisMonth), (e) => e.amount)))}
          hint={`${expenses.length} entries in all`}
          icon={<ReceiptText size={18} />}
        />
        <StatTile tone="violet" href="/finance/overhead" label="Charged to head office" value={formatMoney(overheadShare)} hint="Allocated to projects as overhead" icon={<Building2 size={18} />} />
        <StatTile
          tone="teal"
          label="Vehicle expenses"
          value={formatMoney(round2(sumBy(expenses.filter((e) => e.category === "vehicle"), (e) => e.amount)))}
          hint="Each over exactly two cost centres"
          icon={<Car size={18} />}
        />
      </StatStrip>
      <Card
        title="Expenses"
        description="Net of VAT, with how each was split"
        action={
          <CsvButton
            filename="expenses"
            rows={[
              ["Number", "Date", "Description", "Category", "Budget line", "Amount", "VAT", "Cost centres"],
              ...expenses.map((e) => [
                e.number,
                e.date.slice(0, 10),
                e.description,
                e.category,
                e.budgetCategory,
                e.amount,
                e.vat,
                e.allocationsView.map((a) => `${a.code} ${a.amount}`).join(" | "),
              ]),
            ]}
          />
        }
      >
        <ExpensesTable expenses={expenses} />
      </Card>
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-5">
        <Card title="Record an expense" description="Split it over its cost centres; the shares must add up to the amount" className="xl:col-span-3">
          <ExpenseForm key={expenses.length} centres={centres.map((c) => ({ value: c.uuid, label: `${c.code} — ${c.name}`, hint: c.kind }))} />
        </Card>
        <Card title="Cost centres" description="Every project is one; departments and vehicles are added here" className="xl:col-span-2">
          <div className="flex flex-col gap-6">
            <CostCentersTable centres={centres} />
            <CostCenterForm key={centres.length} />
          </div>
        </Card>
      </div>
    </>
  );
};
