import { ContractsBoard } from "@/components/procurement/contracts-board";
import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";

const ContractsPage = () => (
  <>
    <PageHeader
      title="Annual contracts"
      description="Agreed prices for the year. A request whose items a contract in force prices is ordered without a new RFQ, on the contract's delivery, payment and penalty terms."
    />
    <AsyncSection reloadKey="contracts">
      <ContractsBoard />
    </AsyncSection>
  </>
);

export default ContractsPage;
