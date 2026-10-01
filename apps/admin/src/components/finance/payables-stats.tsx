import { AlarmClock, BadgeCheck, CircleDollarSign, FileClock } from "lucide-react";
import { listSupplierInvoices } from "services";
import { StatTile } from "ui";
import { formatCompactMoney, formatMoney, sumBy } from "utils";

export const PayablesStats = async () => {
  const invoices = await listSupplierInvoices();
  const registered = invoices.filter((i) => i.status === "registered");
  const approved = invoices.filter((i) => i.status === "approved");
  const overdue = invoices.filter((i) => i.overdue);
  const open = invoices.filter((i) => i.status !== "rejected" && i.outstanding > 0);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile
        tone="warning" href="/finance/payables?status=registered"
        label="Awaiting approval"
        value={registered.length}
        hint={`${formatMoney(sumBy(registered, (i) => i.netPayable))} registered and matched`}
        icon={<FileClock size={18} />}
      />
      <StatTile
        tone="sky" href="/finance/payables?status=approved"
        label="Approved, unpaid"
        value={approved.length}
        hint={`${formatMoney(sumBy(approved, (i) => i.outstanding))} on the due schedule`}
        icon={<BadgeCheck size={18} />}
      />
      <StatTile
        tone="danger" href="/finance/payables?status=overdue"
        label="Overdue"
        value={overdue.length}
        hint={`${formatMoney(sumBy(overdue, (i) => i.outstanding))} past its due date`}
        icon={<AlarmClock size={18} />}
      />
      <StatTile
        tone="primary" href="/finance/schedule"
        label="Outstanding"
        value={formatCompactMoney(sumBy(open, (i) => i.outstanding))}
        hint={`${open.length} invoice(s) not fully paid`}
        icon={<CircleDollarSign size={18} />}
      />
    </div>
  );
};
