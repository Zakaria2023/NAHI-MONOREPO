import { NewSubcontract } from "@/components/finance/new-subcontract";
import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";

const NewSubcontractPage = () => (
  <>
    <PageHeader
      title="New subcontract"
      description="A work order with a subcontractor: its value, retention and advance."
      back={{ href: "/finance/subcontracts", label: "Subcontractors" }}
    />
    <AsyncSection reloadKey="new-subcontract">
      <NewSubcontract />
    </AsyncSection>
  </>
);

export default NewSubcontractPage;
