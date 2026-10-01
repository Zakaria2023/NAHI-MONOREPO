import Link from "next/link";
import { weeklyDueSchedule } from "services";
import { Card, EmptyState, StatusPill } from "ui";
import { daysUntil, formatDate, formatMoney } from "utils";
import { DueDate } from "./due-date";

/** Finance §1 step 6: every approved invoice in the week it falls due. */
export const DueSchedule = async () => {
  const weeks = await weeklyDueSchedule();
  if (weeks.length === 0) {
    return <EmptyState title="Nothing is due">Approved supplier invoices appear here, in the week they fall due, until they are paid.</EmptyState>;
  }
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {weeks.map((week) => {
        const past = daysUntil(week.weekOf) < -6;
        return (
          <Card
            key={week.weekOf}
            title={`Week of ${formatDate(week.weekOf)}`}
            description={`${week.invoices.length} invoice(s)`}
            action={
              <div className="flex flex-col items-end gap-1">
                <span className="text-base text-ink tabular-nums">{formatMoney(week.total)}</span>
                {past && <StatusPill tone="danger">Past due</StatusPill>}
              </div>
            }
          >
            <ul className="flex flex-col divide-y divide-hairline-soft">
              {week.invoices.map((invoice) => (
                <li key={invoice.uuid} className="relative flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="flex flex-col gap-0.5">
                    <Link href={`/finance/payables/${invoice.uuid}`} dir="ltr" className="w-fit text-sm font-medium text-ink after:absolute after:inset-0 hover:text-primary">
                      {invoice.number}
                    </Link>
                    <span className="text-xs text-muted">{invoice.supplierName}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-sm">
                    <span className="tabular-nums">{formatMoney(invoice.outstanding)}</span>
                    <div className="text-xs text-muted">
                      <DueDate dueAt={invoice.dueDate} overdue={invoice.overdue} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
};
