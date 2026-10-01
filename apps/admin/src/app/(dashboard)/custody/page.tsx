import { CashCustodyStats } from "@/components/custody/cash-custody-stats";
import { CashCustodyTable } from "@/components/custody/cash-custody-table";
import { AsyncSection } from "@/components/shared/async-section";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { CashCustodyStatus } from "@/db/enum";

type Props = {
  searchParams: Promise<{ status?: string }>;
};

const TABS: { status: CashCustodyStatus; label: string }[] = [
  { status: "pending_approval", label: "Awaiting approval" },
  { status: "approved", label: "To disburse" },
  { status: "disbursed", label: "With employee" },
  { status: "settled", label: "Settled" },
];

const CashCustodyPage = async ({ searchParams }: Props) => {
  const { status: raw } = await searchParams;
  const status = TABS.find((t) => t.status === raw)?.status;
  return (
    <>
      <PageHeader
        title="Cash custody"
        description="Cash advanced to employees for a project: six approvals, disbursement against a signed receipt, then settlement."
        action={{ href: "/custody/new", label: "New cash custody" }}
      />
      <AsyncSection reloadKey="cash-custody-stats">
        <CashCustodyStats />
      </AsyncSection>
      <FilterTabs
        tabs={[
          { label: "All", href: "/custody", active: !status },
          ...TABS.map((t) => ({ label: t.label, href: `/custody?status=${t.status}`, active: status === t.status })),
        ]}
      />
      <AsyncSection reloadKey={`cash-custody-${status ?? ""}`}>
        <CashCustodyTable status={status} />
      </AsyncSection>
    </>
  );
};

export default CashCustodyPage;
