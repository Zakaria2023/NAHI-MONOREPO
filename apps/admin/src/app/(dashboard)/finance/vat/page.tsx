import { VatSummary } from "@/components/finance/vat-summary";
import { AsyncSection } from "@/components/shared/async-section";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { PageHeader } from "@/components/shared/page-header";

type Props = {
  searchParams: Promise<{ view?: string }>;
};

const VatPage = async ({ searchParams }: Props) => {
  const { view } = await searchParams;
  const quarterly = view === "quarterly";
  return (
    <>
      <PageHeader
        title="VAT"
        description="Output VAT on customer invoices against input VAT on supplier invoices and expenses, at 15 % — by month, or as the quarterly return."
      />
      <FilterTabs
        tabs={[
          { label: "Monthly", href: "/finance/vat", active: !quarterly },
          { label: "Quarterly", href: "/finance/vat?view=quarterly", active: quarterly },
        ]}
      />
      <AsyncSection reloadKey={quarterly ? "q" : "m"}>
        <VatSummary quarterly={quarterly} />
      </AsyncSection>
    </>
  );
};

export default VatPage;
