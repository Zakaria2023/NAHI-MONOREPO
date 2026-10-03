import { NewExpense } from "@/components/costs/new-expense";
import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";

const NewExpensePage = () => (
  <>
    <PageHeader
      title="Record an expense"
      description="Split it over its cost centres; the shares must add up to the amount. A share charged to a project counts against its budget."
      back={{ href: "/finance/expenses", label: "Expenses & cost centres" }}
    />
    <AsyncSection reloadKey="new-expense">
      <NewExpense />
    </AsyncSection>
  </>
);

export default NewExpensePage;
