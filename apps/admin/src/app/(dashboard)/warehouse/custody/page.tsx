import { AsyncSection } from "@/components/shared/async-section";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { AssetCustodyTable } from "@/components/warehouse/asset-custody-table";

type Props = {
  searchParams: Promise<{ filter?: string }>;
};

const FILTERS = ["open", "overdue", "closed"] as const;

const AssetCustodyPage = async ({ searchParams }: Props) => {
  const { filter: raw } = await searchParams;
  const filter = FILTERS.find((f) => f === raw);
  return (
    <>
      <PageHeader
        title="Asset custody"
        description="Fixed assets held by employees until they are returned, with the periodic custody count each one is due for."
        action={{ href: "/warehouse/issue-requests/new", label: "Issue an asset" }}
      />
      <FilterTabs
        tabs={[
          { label: "All", href: "/warehouse/custody", active: !filter },
          { label: "With employees", href: "/warehouse/custody?filter=open", active: filter === "open" },
          { label: "Count overdue", href: "/warehouse/custody?filter=overdue", active: filter === "overdue" },
          { label: "Closed", href: "/warehouse/custody?filter=closed", active: filter === "closed" },
        ]}
      />
      <AsyncSection reloadKey={`asset-custody-${filter ?? ""}`}>
        <AssetCustodyTable filter={filter} />
      </AsyncSection>
    </>
  );
};

export default AssetCustodyPage;
