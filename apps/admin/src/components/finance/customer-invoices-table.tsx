import Link from "next/link";
import { listCustomerInvoices } from "services";
import { StatusPill, Table } from "ui";
import { daysUntil, formatDate, formatMoney } from "utils";
import { CUSTOMER_INVOICE_BASIS_LABELS } from "@/db/label";
import { collectCustomerInvoiceAction } from "@/app/(dashboard)/finance/receivables/actions";
import { OperatorPill } from "@/components/shared/operator-pill";
import { InvoiceCollectionForm } from "./invoice-collection-form";

export type CustomerInvoiceFilter = "all" | "outstanding" | "overdue" | "collected";

type CustomerInvoicesTableProps = {
  filter: CustomerInvoiceFilter;
};

export const CustomerInvoicesTable = async ({ filter }: CustomerInvoicesTableProps) => {
  const invoices = (await listCustomerInvoices()).filter((i) =>
    filter === "all" ? true : filter === "collected" ? Boolean(i.paidAt) : filter === "overdue" ? i.overdue : !i.paidAt,
  );
  return (
    <Table
      data={invoices}
      rowKey={(i) => i.uuid}
      emptyMessage={
        filter === "all"
          ? "No customer invoice yet. Mobily is invoiced per certificate from the project page; STC on the approved As-Built below."
          : "No invoice in this view."
      }
      columns={[
        {
          key: "number",
          header: "Invoice",
          render: (i) => (
            <span dir="ltr" className="font-medium">
              {i.number}
            </span>
          ),
        },
        {
          key: "project",
          header: "Project",
          render: (i) => (
            <div className="flex flex-col gap-0.5">
              <Link href={`/projects/${i.projectUuid}`} dir="ltr" className="w-fit hover:text-primary">
                {i.projectCode}
              </Link>
              <span className="line-clamp-1 text-xs text-muted">{i.projectName}</span>
            </div>
          ),
        },
        { key: "operator", header: "Customer", render: (i) => <OperatorPill operator={i.operator} /> },
        { key: "basis", header: "Basis", render: (i) => <span className="whitespace-nowrap">{CUSTOMER_INVOICE_BASIS_LABELS[i.basis]}</span> },
        { key: "amount", header: "Amount", align: "end", render: (i) => formatMoney(i.amount) },
        { key: "vat", header: "VAT", align: "end", render: (i) => formatMoney(i.vat) },
        { key: "total", header: "Total", align: "end", render: (i) => <span className="font-medium">{formatMoney(i.total)}</span> },
        { key: "submitted", header: "Submitted", render: (i) => <span className="whitespace-nowrap">{formatDate(i.submittedAt)}</span> },
        { key: "due", header: "Due", render: (i) => <span className="whitespace-nowrap">{formatDate(i.dueAt)}</span> },
        {
          key: "collection",
          header: "Collection",
          render: (i) =>
            i.paidAt ? (
              <StatusPill tone="success">Collected {formatDate(i.paidAt)}</StatusPill>
            ) : (
              <div className="flex flex-col items-start gap-2">
                <StatusPill tone={i.overdue ? "danger" : "warning"}>
                  {i.overdue ? `Overdue · ${-daysUntil(i.dueAt)} days` : `Due in ${daysUntil(i.dueAt)} days`}
                </StatusPill>
                <InvoiceCollectionForm action={collectCustomerInvoiceAction.bind(null, i.uuid)} />
              </div>
            ),
        },
      ]}
    />
  );
};
