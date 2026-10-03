import { listCostCenters } from "services";
import { Card } from "ui";
import { ExpenseForm } from "./expense-form";

export const NewExpense = async () => {
  const centres = await listCostCenters();
  return (
    <Card title="Expense" description="Net of VAT; a vehicle expense is always split over exactly two cost centres">
      <ExpenseForm centres={centres.map((c) => ({ value: c.uuid, label: `${c.code} — ${c.name}`, hint: c.kind }))} />
    </Card>
  );
};
