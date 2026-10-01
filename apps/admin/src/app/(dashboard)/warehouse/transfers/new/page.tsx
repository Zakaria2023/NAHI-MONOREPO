import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";
import { NewTransfer } from "@/components/warehouse/new-transfer";

const NewTransferPage = () => (
  <>
    <PageHeader
      title="New transfer"
      description="Move stock between warehouses — approved by the storekeeper, region accountant, region PM, projects manager and COO."
      back={{ href: "/warehouse/documents?kind=stock_transfer", label: "Warehouse documents" }}
    />
    <AsyncSection reloadKey="new-transfer">
      <NewTransfer />
    </AsyncSection>
  </>
);

export default NewTransferPage;
