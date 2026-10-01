import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";
import { NewWriteOff } from "@/components/warehouse/new-write-off";

const NewWriteOffPage = () => (
  <>
    <PageHeader
      title="New write-off"
      description="Approved by the storekeeper, region PM, projects manager, CFO, COO and deputy GM."
      back={{ href: "/warehouse/documents?kind=write_off", label: "Warehouse documents" }}
    />
    <AsyncSection reloadKey="new-write-off">
      <NewWriteOff />
    </AsyncSection>
  </>
);

export default NewWriteOffPage;
