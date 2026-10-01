import { PurchaseOrderTabs } from "@/components/procurement/purchase-order-tabs";
import { PurchaseOrdersTable } from "@/components/procurement/purchase-orders-table";
import { AsyncSection } from "@/components/shared/async-section";
import { ListSearch } from "@/components/shared/list-search";
import { PageHeader } from "@/components/shared/page-header";

type Props = {
  searchParams: Promise<{ status?: string; search?: string }>;
};

const PurchaseOrdersPage = async ({ searchParams }: Props) => {
  const { status, search } = await searchParams;
  return (
    <>
      <PageHeader
        title="Purchase orders"
        description="POs raised from approved quotations: their approval, delivery follow-up, receiving and the supplier's evaluation."
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PurchaseOrderTabs group={status} />
        <ListSearch placeholder="Search PO, supplier, project…" defaultValue={search} />
      </div>
      <AsyncSection reloadKey={`purchase-orders-${status ?? ""}-${search ?? ""}`}>
        <PurchaseOrdersTable group={status} search={search} />
      </AsyncSection>
    </>
  );
};

export default PurchaseOrdersPage;
