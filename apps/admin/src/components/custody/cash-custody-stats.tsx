import { AlarmClock, Hourglass, Wallet } from "lucide-react";
import { CUSTODY_SETTLEMENT_DAYS, listCashCustodies } from "services";
import { StatTile } from "ui";
import { formatCompactMoney, formatMoney, sumBy } from "utils";

export const CashCustodyStats = async () => {
  const rows = await listCashCustodies();
  const disbursed = rows.filter((r) => r.status === "disbursed");
  const pending = rows.filter((r) => r.status === "pending_approval");
  const overdue = disbursed.filter((r) => (r.openDays ?? 0) > CUSTODY_SETTLEMENT_DAYS);
  const outstanding = sumBy(disbursed, (r) => r.amount);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatTile
        tone="sky" href="/custody?status=disbursed"
        label="With employees"
        value={formatCompactMoney(outstanding)}
        hint={`${formatMoney(outstanding)} in ${disbursed.length} disbursed custody`}
        icon={<Wallet size={18} />}
      />
      <StatTile
        tone="warning" href="/custody?status=pending_approval"
        label="Awaiting approval"
        value={pending.length}
        hint={`${formatMoney(sumBy(pending, (r) => r.amount))} requested`}
        icon={<Hourglass size={18} />}
      />
      <StatTile
        tone="danger" href="/custody?status=disbursed"
        label="Settlement overdue"
        value={overdue.length}
        hint={`Open more than ${CUSTODY_SETTLEMENT_DAYS} days`}
        icon={<AlarmClock size={18} />}
      />
    </div>
  );
};
