import { MailCheck } from "lucide-react";
import { SupplierPayment } from "services";
import { Table } from "ui";
import { formatDate, formatDateTime, formatMoney } from "utils";
import { PAYMENT_METHOD_LABELS } from "@/db/label";

type SupplierPaymentsTableProps = {
  payments: SupplierPayment[];
};

export const SupplierPaymentsTable = ({ payments }: SupplierPaymentsTableProps) => (
  <Table
    data={payments}
    rowKey={(p) => p.uuid}
    emptyMessage="No payment recorded against this invoice yet."
    columns={[
      { key: "at", header: "Paid on", render: (p) => formatDate(p.at) },
      { key: "method", header: "Method", render: (p) => PAYMENT_METHOD_LABELS[p.method] },
      { key: "reference", header: "Reference", render: (p) => <span dir="ltr">{p.reference}</span> },
      { key: "amount", header: "Amount", align: "end", render: (p) => formatMoney(p.amount) },
      { key: "by", header: "Recorded by", render: (p) => <span className="text-secondary">{p.by}</span> },
      {
        key: "notice",
        header: "Notice e-mailed",
        render: (p) => (
          <span className="flex items-center gap-1.5 text-secondary">
            <MailCheck size={14} className="text-success" />
            {formatDateTime(p.noticeSentAt)}
          </span>
        ),
      },
    ]}
  />
);
