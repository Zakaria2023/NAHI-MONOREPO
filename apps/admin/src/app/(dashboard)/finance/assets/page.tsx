import { AssetsBoard } from "@/components/assets/assets-board";
import { AsyncSection } from "@/components/shared/async-section";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { PageHeader } from "@/components/shared/page-header";

type Props = {
  searchParams: Promise<{ status?: string }>;
};

const FILTERS = [
  { key: "active", label: "In use" },
  { key: "disposed", label: "Disposed" },
  { key: "all", label: "All" },
];

const AssetsPage = async ({ searchParams }: Props) => {
  const { status = "active" } = await searchParams;
  return (
    <>
      <PageHeader
        title="Fixed assets"
        description="The asset register: each asset's card, where it is or who holds it, its depreciation to date and book value, the annual count and disposals."
        action={{ href: "/finance/assets/new", label: "Register asset" }}
      />
      <FilterTabs tabs={FILTERS.map((f) => ({ label: f.label, href: `/finance/assets?status=${f.key}`, active: f.key === status }))} />
      <AsyncSection reloadKey={status}>
        <AssetsBoard status={status} />
      </AsyncSection>
    </>
  );
};

export default AssetsPage;
