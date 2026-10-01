import { PayablesStats } from "@/components/finance/payables-stats";
import { SupplierInvoiceFilter, SupplierInvoicesTable } from "@/components/finance/supplier-invoices-table";
import { AsyncSection } from "@/components/shared/async-section";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { PageHeader } from "@/components/shared/page-header";

type Props = {
  searchParams: Promise<{ status?: string }>;
};

const FILTERS: { value: SupplierInvoiceFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "registered", label: "Awaiting approval" },
  { value: "approved", label: "Approved" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
];

const PayablesPage = async ({ searchParams }: Props) => {
  const { status } = await searchParams;
  const filter = FILTERS.find((f) => f.value === status)?.value ?? "all";
  return (
    <>
      <PageHeader
        title="Supplier invoices"
        description="Accounts payable: every invoice matched to its PO and receipts, the advance recovered, and what is still owed."
        action={{ href: "/finance/payables/new", label: "Register invoice" }}
      />
      <AsyncSection reloadKey="payables-stats">
        <PayablesStats />
      </AsyncSection>
      <FilterTabs
        tabs={FILTERS.map((f) => ({
          label: f.label,
          href: f.value === "all" ? "/finance/payables" : `/finance/payables?status=${f.value}`,
          active: f.value === filter,
        }))}
      />
      <AsyncSection reloadKey={`payables-${filter}`}>
        <SupplierInvoicesTable filter={filter} />
      </AsyncSection>
    </>
  );
};

export default PayablesPage;
