import { ObligationsBoard } from "@/components/treasury/obligations-board";
import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";

const ObligationsPage = () => (
  <>
    <PageHeader
      title="Tax & insurance calendar"
      description="Each month's VAT return and social insurance payment with its due date — an alert goes up seven days before. Filing records the reference and fixes the amount."
    />
    <AsyncSection reloadKey="obligations">
      <ObligationsBoard />
    </AsyncSection>
  </>
);

export default ObligationsPage;
