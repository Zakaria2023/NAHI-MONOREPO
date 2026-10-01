import { VatSummary } from "@/components/finance/vat-summary";
import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";

const VatPage = () => (
  <>
    <PageHeader
      title="VAT summary"
      description="Output VAT on customer invoices against input VAT on supplier invoices, month by month, at 15 %."
    />
    <AsyncSection reloadKey="vat">
      <VatSummary />
    </AsyncSection>
  </>
);

export default VatPage;
