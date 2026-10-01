import { NewPurchaseRequest } from "@/components/procurement/new-purchase-request";
import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";

const NewPurchaseRequestPage = () => (
  <>
    <PageHeader
      title="New purchase request"
      description="Name the items, quantities and the date they are needed. It goes to the direct manager first, then to procurement."
      back={{ href: "/procurement/requests", label: "Purchase requests" }}
    />
    <AsyncSection reloadKey="new-purchase-request">
      <NewPurchaseRequest />
    </AsyncSection>
  </>
);

export default NewPurchaseRequestPage;
