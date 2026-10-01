import { AsBuiltInvoiceSection } from "@/components/finance/as-built-invoice-section";
import { CustomerInvoiceFilter, CustomerInvoicesTable } from "@/components/finance/customer-invoices-table";
import { ReceivablesStats } from "@/components/finance/receivables-stats";
import { AsyncSection } from "@/components/shared/async-section";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { PageHeader } from "@/components/shared/page-header";

type Props = {
  searchParams: Promise<{ status?: string }>;
};

const FILTERS: { value: CustomerInvoiceFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "outstanding", label: "Outstanding" },
  { value: "overdue", label: "Overdue" },
  { value: "collected", label: "Collected" },
];

const ReceivablesPage = async ({ searchParams }: Props) => {
  const { status } = await searchParams;
  const filter = FILTERS.find((f) => f.value === status)?.value ?? "all";
  return (
    <>
      <PageHeader
        title="Customer invoices"
        description="Tax invoices to Mobily and STC and their collection; an invoice turns red the day its due date passes unpaid."
      />
      <AsyncSection reloadKey="receivables-stats">
        <ReceivablesStats />
      </AsyncSection>
      <FilterTabs
        tabs={FILTERS.map((f) => ({
          label: f.label,
          href: f.value === "all" ? "/finance/receivables" : `/finance/receivables?status=${f.value}`,
          active: f.value === filter,
        }))}
      />
      <AsyncSection reloadKey={`receivables-${filter}`}>
        <CustomerInvoicesTable filter={filter} />
      </AsyncSection>
      <AsyncSection reloadKey="as-built-invoice">
        <AsBuiltInvoiceSection />
      </AsyncSection>
    </>
  );
};

export default ReceivablesPage;
