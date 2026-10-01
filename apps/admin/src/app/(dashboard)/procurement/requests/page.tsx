import { PurchaseRequestTabs } from "@/components/procurement/purchase-request-tabs";
import { PurchaseRequestsTable } from "@/components/procurement/purchase-requests-table";
import { AsyncSection } from "@/components/shared/async-section";
import { ListSearch } from "@/components/shared/list-search";
import { PageHeader } from "@/components/shared/page-header";

type Props = {
  searchParams: Promise<{ status?: string; search?: string }>;
};

const PurchaseRequestsPage = async ({ searchParams }: Props) => {
  const { status, search } = await searchParams;
  return (
    <>
      <PageHeader
        title="Purchase requests"
        description="Requests from the departments, from the direct manager's approval through procurement's review to stock supply or a purchase order."
        action={{ href: "/procurement/requests/new", label: "New purchase request" }}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PurchaseRequestTabs group={status} />
        <ListSearch placeholder="Search number, project, department…" defaultValue={search} />
      </div>
      <AsyncSection reloadKey={`purchase-requests-${status ?? ""}-${search ?? ""}`}>
        <PurchaseRequestsTable group={status} search={search} />
      </AsyncSection>
    </>
  );
};

export default PurchaseRequestsPage;
