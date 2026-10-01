import { ClosingPeriods } from "@/components/finance/closing-periods";
import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";

const ClosingPage = () => (
  <>
    <PageHeader
      title="Monthly closing"
      description="A period closes only when every checklist item is done. Procurement & warehouse and custody can be ticked only when the system shows nothing open."
    />
    <AsyncSection reloadKey="closing">
      <ClosingPeriods />
    </AsyncSection>
  </>
);

export default ClosingPage;
