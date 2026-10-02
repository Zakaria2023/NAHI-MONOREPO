import { ClosingPeriods } from "@/components/finance/closing-periods";
import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";

const ClosingPage = () => (
  <>
    <PageHeader
      title="Monthly closing"
      description="A period closes only when every checklist item is done. Some items are checked by the system: procurement & warehouse and custody need nothing open, payroll needs the month paid, depreciation needs the month posted."
    />
    <AsyncSection reloadKey="closing">
      <ClosingPeriods />
    </AsyncSection>
  </>
);

export default ClosingPage;
