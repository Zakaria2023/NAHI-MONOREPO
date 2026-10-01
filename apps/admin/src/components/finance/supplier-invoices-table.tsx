import Link from "next/link";
import { listSupplierInvoices } from "services";
import { StatusPill, Table } from "ui";
import { formatDate, formatMoney } from "utils";
import { SUPPLIER_INVOICE_STATUS_LABELS } from "@/db/label";
import { SUPPLIER_INVOICE_TONES } from "@/lib/status-tones";
import { DueDate } from "./due-date";

export type SupplierInvoiceFilter = "all" | "registered" | "approved" | "overdue" | "paid";

type SupplierInvoicesTableProps = {
  filter: SupplierInvoiceFilter;
};

export const SupplierInvoicesTable = async ({ filter }: SupplierInvoicesTableProps) => {
  const invoices = (await listSupplierInvoices()).filter((i) =>
    filter === "all" ? true : filter === "overdue" ? i.overdue : i.status === filter,
  );
  return (
    <Table
      data={invoices}
      rowKey={(i) => i.uuid}
      emptyMessage={
        filter === "all"
          ? "No supplier invoice yet. Register one against a PO and its goods receipts."
          : "No invoice in this view."
      }
      columns={[
        {
          key: "number",
          header: "Invoice",
          render: (i) => (
            <div className="flex flex-col gap-0.5">
              <Link href={`/finance/payables/${i.uuid}`} dir="ltr" className="font-medium after:absolute after:inset-0 hover:text-primary">
                {i.number}
              </Link>
              <span className="text-xs text-muted">{formatDate(i.invoiceDate)}</span>
            </div>
          ),
        },
        {
          key: "supplier",
          header: "Supplier",
          render: (i) => (
            <div className="flex flex-col gap-0.5">
              <span>{i.supplierName}</span>
              <span dir="ltr" className="text-xs text-muted">
                {i.invoiceNumber}
              </span>
            </div>
          ),
        },
        { key: "po", header: "PO", render: (i) => <span dir="ltr">{i.poNumber}</span> },
        { key: "total", header: "Total", align: "end", render: (i) => formatMoney(i.total) },
        {
          key: "advance",
          header: "Advance recovered",
          align: "end",
          render: (i) => (i.advanceDeducted > 0 ? formatMoney(i.advanceDeducted) : <span className="text-muted">—</span>),
        },
        { key: "net", header: "Net payable", align: "end", render: (i) => formatMoney(i.netPayable) },
        { key: "paid", header: "Paid", align: "end", render: (i) => (i.paid > 0 ? formatMoney(i.paid) : <span className="text-muted">—</span>) },
        {
          key: "outstanding",
          header: "Outstanding",
          align: "end",
          render: (i) => <span className={i.overdue ? "text-danger" : ""}>{formatMoney(i.outstanding)}</span>,
        },
        { key: "due", header: "Due", render: (i) => <DueDate dueAt={i.dueDate} overdue={i.overdue} /> },
        {
          key: "status",
          header: "Status",
          render: (i) => <StatusPill tone={SUPPLIER_INVOICE_TONES[i.status]}>{SUPPLIER_INVOICE_STATUS_LABELS[i.status]}</StatusPill>,
        },
      ]}
    />
  );
};
