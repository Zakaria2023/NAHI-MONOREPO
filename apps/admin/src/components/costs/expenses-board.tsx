import { Building2, Car, Plus, ReceiptText } from "lucide-react";
import { listCostCenters, listExpenses } from "services";
import { Card, StatStrip, StatTile } from "ui";
import { formatMoney, round2, sumBy } from "utils";
import { CsvButton } from "@/components/shared/csv-button";
import { FormDialog } from "@/components/shared/form-dialog";
import { CostCenterForm } from "./cost-center-form";
import { CostCentersTable } from "./cost-centers-table";
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
      <Card
        title="Cost centres"
        description="Every project is one; departments and vehicles are added here"
        action={
          <FormDialog label="Add cost centre" title="Add a cost centre" description="A department or a vehicle; every project is one already" icon={<Plus size={16} />} size="sm">
            <CostCenterForm />
          </FormDialog>
        }
      >
        <CostCentersTable centres={centres} />
      </Card>
    </>
  );
};
