import { BudgetFilter, BudgetsTable } from "@/components/finance/budgets-table";
import { AsyncSection } from "@/components/shared/async-section";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { PageHeader } from "@/components/shared/page-header";

type Props = {
  searchParams: Promise<{ status?: string }>;
};

const FILTERS: { value: BudgetFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Not approved" },
  { value: "approved", label: "Approved" },
  { value: "overrun", label: "Overrun" },
];

const BudgetsPage = async ({ searchParams }: Props) => {
  const { status } = await searchParams;
  const filter = FILTERS.find((f) => f.value === status)?.value ?? "all";
  return (
    <>
      <PageHeader
        title="Project budgets"
        description="Each project's approved budget against what is reserved by requests, committed on POs and spent through custody, extracts and stock."
      />
      <FilterTabs
        tabs={FILTERS.map((f) => ({
          label: f.label,
          href: f.value === "all" ? "/finance/budgets" : `/finance/budgets?status=${f.value}`,
          active: f.value === filter,
        }))}
      />
      <AsyncSection reloadKey={`budgets-${filter}`}>
        <BudgetsTable filter={filter} />
      </AsyncSection>
    </>
  );
};

export default BudgetsPage;
