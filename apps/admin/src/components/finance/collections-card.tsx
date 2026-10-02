import { CustomerInvoiceRow } from "services";
import { Card, StatusPill } from "ui";
import { daysUntil, formatMoney } from "utils";
import { collectCustomerInvoiceAction } from "@/app/(dashboard)/finance/receivables/actions";
import { InvoiceCollectionForm } from "./invoice-collection-form";

type CollectionsCardProps = {
  invoices: CustomerInvoiceRow[];
};

/** One line per open invoice, with room for how it was collected — transfer, or a cheque and its due date. */
export const CollectionsCard = ({ invoices }: CollectionsCardProps) => (
  <Card title="Record a collection" description="A cheque is booked now and shows in Cheques until it clears; if it bounces, the invoice opens again">
    <ul className="-my-1 flex flex-col divide-y divide-hairline-soft">
      {invoices.map((i) => (
        <li key={i.uuid} className="flex flex-wrap items-end justify-between gap-4 py-4">
          <div className="flex min-w-48 flex-col gap-1">
            <span className="flex items-center gap-2">
              <span dir="ltr" className="font-medium text-ink">
                {i.number}
              </span>
              <span className="text-sm text-muted">{i.projectCode}</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="text-sm text-ink">{formatMoney(i.total)}</span>
              <StatusPill tone={i.overdue ? "danger" : "warning"}>
                {i.overdue ? `Overdue · ${-daysUntil(i.dueAt)} days` : `Due in ${daysUntil(i.dueAt)} days`}
              </StatusPill>
            </span>
          </div>
          <InvoiceCollectionForm action={collectCustomerInvoiceAction.bind(null, i.uuid)} />
        </li>
      ))}
    </ul>
  </Card>
);
