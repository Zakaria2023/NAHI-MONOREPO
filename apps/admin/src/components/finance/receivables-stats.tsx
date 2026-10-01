import { AlarmClock, CircleCheck, Wallet } from "lucide-react";
import { listCustomerInvoices } from "services";
import { StatStrip, StatTile } from "ui";
import { formatCompactMoney, formatMoney, sumBy } from "utils";

export const ReceivablesStats = async () => {
  const invoices = await listCustomerInvoices();
  const open = invoices.filter((i) => !i.paidAt);
  const overdue = invoices.filter((i) => i.overdue);
  const collected = invoices.filter((i) => i.paidAt);
  return (
    <StatStrip columns="sm:grid-cols-3">
      <StatTile
        tone="primary" href="/finance/receivables?status=outstanding"
        label="Outstanding"
        value={formatCompactMoney(sumBy(open, (i) => i.total))}
        hint={`${open.length} invoice(s), ${formatMoney(sumBy(open, (i) => i.total))} with VAT`}
        icon={<Wallet size={18} />}
      />
      <StatTile
        tone="danger" href="/finance/receivables?status=overdue"
        label="Overdue"
        value={overdue.length}
        hint={`${formatMoney(sumBy(overdue, (i) => i.total))} past the due date`}
        icon={<AlarmClock size={18} />}
      />
      <StatTile
        tone="success" href="/finance/receivables?status=collected"
        label="Collected"
        value={formatCompactMoney(sumBy(collected, (i) => i.total))}
        hint={`${collected.length} invoice(s) paid`}
        icon={<CircleCheck size={18} />}
      />
    </StatStrip>
  );
};
