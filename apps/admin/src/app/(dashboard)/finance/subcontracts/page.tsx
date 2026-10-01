import { SubcontractFormSection } from "@/components/finance/subcontract-form-section";
import { SubcontractorsList } from "@/components/finance/subcontractors-list";
import { SubcontractsSection } from "@/components/finance/subcontracts-section";
import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";

const SubcontractsPage = () => (
  <>
    <PageHeader
      title="Subcontractors"
      description="Every subcontract with what has been certified, the retention held, the advance recovered and the warehouse materials still to deduct."
      action={{ href: "/finance/extracts/new", label: "New extract" }}
    />
    <AsyncSection reloadKey="subcontracts">
      <SubcontractsSection />
    </AsyncSection>
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <AsyncSection reloadKey="subcontract-form">
          <SubcontractFormSection />
        </AsyncSection>
      </div>
      <AsyncSection reloadKey="subcontractors">
        <SubcontractorsList />
      </AsyncSection>
    </div>
  </>
);

export default SubcontractsPage;
