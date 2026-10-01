import { ExtractFilter, ExtractsSection } from "@/components/finance/extracts-section";
import { AsyncSection } from "@/components/shared/async-section";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { PageHeader } from "@/components/shared/page-header";

type Props = {
  searchParams: Promise<{ status?: string }>;
};

const FILTERS: { value: ExtractFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Awaiting approval" },
  { value: "approved", label: "Posted for payment" },
  { value: "paid", label: "Paid" },
  { value: "rejected", label: "Rejected" },
];

const ExtractsPage = async ({ searchParams }: Props) => {
  const { status } = await searchParams;
  const filter = FILTERS.find((f) => f.value === status)?.value ?? "all";
  return (
    <>
      <PageHeader
        title="Extracts"
        description="Subcontractors' executed quantities, reviewed by the project engineer, the projects manager and finance, net of advance, retention, penalties and materials."
        action={{ href: "/finance/extracts/new", label: "New extract" }}
      />
      <FilterTabs
        tabs={FILTERS.map((f) => ({
          label: f.label,
          href: f.value === "all" ? "/finance/extracts" : `/finance/extracts?status=${f.value}`,
          active: f.value === filter,
        }))}
      />
      <AsyncSection reloadKey={`extracts-${filter}`}>
        <ExtractsSection filter={filter} />
      </AsyncSection>
    </>
  );
};

export default ExtractsPage;
