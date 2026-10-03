import { BankBoard } from "@/components/treasury/bank-board";
import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";

type Props = {
  searchParams: Promise<{ account?: string; period?: string }>;
};

const BankPage = async ({ searchParams }: Props) => {
  const { account, period } = await searchParams;
  return (
    <>
      <PageHeader
        title="Bank accounts"
        description="Balances worked out from every payment and collection the system records, each month's movements, and the reconciliation of the bank statement against the book."
        action={{ href: "/finance/bank/new", label: "New bank account" }}
      />
      <AsyncSection reloadKey={`${account}-${period}`}>
        <BankBoard accountUuid={account} period={period} />
      </AsyncSection>
    </>
  );
};

export default BankPage;
