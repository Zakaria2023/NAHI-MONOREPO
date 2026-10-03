import { ExpensesBoard } from "@/components/costs/expenses-board";
import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";

const ExpensesPage = () => (
  <>
    <PageHeader
      title="Expenses & cost centres"
      description="Manual expense entries, each charged to cost centres — never without one, and a vehicle's always over exactly two. A share charged to a project counts against its budget."
      action={{ href: "/finance/expenses/new", label: "Record expense" }}
    />
    <AsyncSection reloadKey="expenses">
      <ExpensesBoard />
    </AsyncSection>
  </>
);

export default ExpensesPage;
