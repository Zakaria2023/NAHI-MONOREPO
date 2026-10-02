import { GuaranteesBoard } from "@/components/treasury/guarantees-board";
import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";

const GuaranteesPage = () => (
  <>
    <PageHeader
      title="Guarantees & retentions"
      description="Letters of guarantee given to customers, with an alert before each expires, and the retentions held on subcontractors."
    />
    <AsyncSection reloadKey="guarantees">
      <GuaranteesBoard />
    </AsyncSection>
  </>
);

export default GuaranteesPage;
