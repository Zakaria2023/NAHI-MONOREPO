import { ChequesBoard } from "@/components/treasury/cheques-board";
import { AsyncSection } from "@/components/shared/async-section";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { PageHeader } from "@/components/shared/page-header";

type Props = {
  searchParams: Promise<{ status?: string }>;
};

const FILTERS = [
  { key: "pending", label: "Pending & post-dated" },
  { key: "bounced", label: "Bounced" },
  { key: "cleared", label: "Cleared" },
  { key: "all", label: "All" },
];

const ChequesPage = async ({ searchParams }: Props) => {
  const { status = "pending" } = await searchParams;
  return (
    <>
      <PageHeader
        title="Cheques"
        description="Cheques issued to suppliers and received from customers: post-dated until their due date, then cleared — or bounced, which puts the invoice back as owed."
      />
      <FilterTabs tabs={FILTERS.map((f) => ({ label: f.label, href: `/finance/cheques?status=${f.key}`, active: f.key === status }))} />
      <AsyncSection reloadKey={status}>
        <ChequesBoard status={status} />
      </AsyncSection>
    </>
  );
};

export default ChequesPage;
