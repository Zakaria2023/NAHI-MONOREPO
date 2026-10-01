import { Card } from "ui";
import { AsyncSection } from "@/components/shared/async-section";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { ListSearch } from "@/components/shared/list-search";
import { PageHeader } from "@/components/shared/page-header";
import { ItemForm } from "@/components/warehouse/item-form";
import { StockStats } from "@/components/warehouse/stock-stats";
import { StockTable } from "@/components/warehouse/stock-table";

type Props = {
  searchParams: Promise<{ filter?: string; search?: string }>;
};

const StockPage = async ({ searchParams }: Props) => {
  const { filter, search } = await searchParams;
  const belowOnly = filter === "below";
  return (
    <>
      <PageHeader
        title="Stock balance"
        description="What every warehouse holds, at average cost, and the items that have fallen under their reorder level."
        action={{ href: "#add-item", label: "Add item" }}
      />
      <AsyncSection reloadKey="stock-stats">
        <StockStats />
      </AsyncSection>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          tabs={[
            { label: "All items", href: "/warehouse/stock", active: !belowOnly },
            { label: "Below reorder", href: "/warehouse/stock?filter=below", active: belowOnly },
          ]}
        />
        <ListSearch placeholder="Search code or name…" defaultValue={search} />
      </div>
      <AsyncSection reloadKey={`stock-${filter ?? ""}-${search ?? ""}`}>
        <StockTable belowOnly={belowOnly} search={search} />
      </AsyncSection>
      <div id="add-item" className="scroll-mt-20">
        <Card title="Add item" description="A new code in the item master. Fixed assets are issued as custody and counted with the employee.">
          <ItemForm />
        </Card>
      </div>
    </>
  );
};

export default StockPage;
