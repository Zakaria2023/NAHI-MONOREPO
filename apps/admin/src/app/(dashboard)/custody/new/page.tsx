import { NewCashCustody } from "@/components/custody/new-cash-custody";
import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";

const NewCashCustodyPage = () => (
  <>
    <PageHeader
      title="New cash custody"
      description="Requested in the employee's name; approved by the region accountant, region PM, projects manager, CFO, COO and deputy GM."
      back={{ href: "/custody", label: "Cash custody" }}
    />
    <AsyncSection reloadKey="new-cash-custody">
      <NewCashCustody />
    </AsyncSection>
  </>
);

export default NewCashCustodyPage;
