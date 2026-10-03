import { Landmark } from "lucide-react";
import { getBankAccount, listBankAccounts } from "services";
import { Card, EmptyState, StatStrip, StatTile } from "ui";
import { formatMoney, formatPeriod, recentPeriods } from "utils";
import { reconcileAction } from "@/app/(dashboard)/finance/bank/actions";
import { CsvButton } from "@/components/shared/csv-button";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { PrintButton } from "@/components/shared/print-button";
import { BankMovementsTable } from "./bank-movements-table";
import { ReconciliationCard } from "./reconciliation-card";

type BankBoardProps = {
  accountUuid?: string;
  period?: string;
};

export const BankBoard = async ({ accountUuid, period: requested }: BankBoardProps) => {
  const accounts = await listBankAccounts();
  if (accounts.length === 0) {
    return (
      <EmptyState title="No bank account yet">Add the first one with “New bank account”.</EmptyState>
    );
  }
  const periods = recentPeriods(6);
  const period = requested && periods.includes(requested) ? requested : periods[0];
  const selected = accounts.find((a) => a.uuid === accountUuid) ?? accounts.find((a) => a.primary) ?? accounts[0];
  const detail = await getBankAccount(selected.uuid, period);
  return (
    <>
      <StatStrip columns={accounts.length > 2 ? "sm:grid-cols-3" : "sm:grid-cols-2"}>
        {accounts.map((a) => (
          <StatTile
            key={a.uuid}
            tone={a.uuid === selected.uuid ? "primary" : "teal"}
            href={`/finance/bank?account=${a.uuid}&period=${period}`}
            label={`${a.code} — ${a.bank}${a.primary ? " (primary)" : ""}`}
            value={formatMoney(a.balance)}
            hint={`${formatMoney(a.pendingIssued)} in cheques not cleared · reconciled to ${a.lastReconciled ? formatPeriod(a.lastReconciled) : "—"}`}
            icon={<Landmark size={18} />}
          />
        ))}
      </StatStrip>
      <FilterTabs tabs={periods.map((p) => ({ label: formatPeriod(p), href: `/finance/bank?account=${selected.uuid}&period=${p}`, active: p === period }))} />
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title={`${selected.code} — ${formatPeriod(period)}`}
          description={`Opening ${formatMoney(detail.opening)} · closing ${formatMoney(detail.closing)}`}
          action={
            <div className="flex flex-wrap gap-2">
              <CsvButton
                filename={`${selected.code}-${period}`}
                rows={[["Date", "Description", "Reference", "Amount", "Balance"], ...detail.movements.map((m) => [m.at.slice(0, 10), m.description, m.reference, m.amount, m.balance])]}
              />
              <PrintButton />
            </div>
          }
        >
          {detail.movements.length === 0 ? (
            <EmptyState title="No movements this month" />
          ) : (
            <BankMovementsTable movements={detail.movements} />
          )}
        </Card>
        <div className="flex flex-col gap-6 print:hidden">
          <ReconciliationCard detail={detail} action={reconcileAction.bind(null, selected.uuid)} />
        </div>
      </div>
    </>
  );
};
