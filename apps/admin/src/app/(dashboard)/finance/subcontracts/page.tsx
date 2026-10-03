import { SubcontractorsList } from "@/components/finance/subcontractors-list";
import { SubcontractsSection } from "@/components/finance/subcontracts-section";
import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";

const SubcontractsPage = () => (
  <>
    <PageHeader
      title="Subcontractors"
      description="Every subcontract with what has been certified, the retention held, the advance recovered and the warehouse materials still to deduct."
      action={{ href: "/finance/subcontracts/new", label: "New subcontract" }}
    />
    <AsyncSection reloadKey="subcontracts">
      <SubcontractsSection />
    </AsyncSection>
    <AsyncSection reloadKey="subcontractors">
      <SubcontractorsList />
    </AsyncSection>
  </>
);

export default SubcontractsPage;
