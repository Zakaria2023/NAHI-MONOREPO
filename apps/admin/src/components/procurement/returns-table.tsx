import Link from "next/link";
import { SupplierReturnRow } from "services";
import { StatusPill, Table } from "ui";
import { formatDate, formatMoney } from "utils";
import { SUPPLIER_RETURN_REMEDY_LABELS, SUPPLIER_RETURN_SOURCE_LABELS, SUPPLIER_RETURN_STATUS_LABELS } from "@/db/label";
import { receiveReplacementAction } from "@/app/(dashboard)/procurement/returns/actions";
import { ActionButton } from "@/components/shared/action-button";

type ReturnsTableProps = {
  returns: SupplierReturnRow[];
  /** The storekeeper books a replacement back into stock. */
  canReceive: boolean;
};

export const ReturnsTable = ({ returns, canReceive }: ReturnsTableProps) => (
  <Table
    data={returns}
    rowKey={(r) => r.uuid}
    emptyMessage="Nothing has been returned to a supplier."
    columns={[
      {
        key: "number",
        header: "Return",
        render: (r) => (
          <div className="flex flex-col gap-0.5">
            <span dir="ltr" className="font-medium">
              {r.number}
            </span>
            <span className="text-xs text-muted">{formatDate(r.createdAt)}</span>
          </div>
        ),
      },
      {
        key: "po",
        header: "PO",
        render: (r) => (
          <Link href={`/procurement/orders/${r.poUuid}`} dir="ltr" className="hover:text-primary">
            {r.poNumber}
          </Link>
        ),
      },
      { key: "supplier", header: "Supplier", render: (r) => r.supplierName },
      { key: "source", header: "Source", render: (r) => <span className="text-secondary">{SUPPLIER_RETURN_SOURCE_LABELS[r.source]}</span> },
      { key: "reason", header: "Reason", wrap: true, render: (r) => r.reason },
      {
        key: "remedy",
        header: "Remedy",
        render: (r) => (
          <div className="flex flex-col gap-0.5">
            <span>{SUPPLIER_RETURN_REMEDY_LABELS[r.remedy]}</span>
            {r.debitNoteNumber && (
              <span dir="ltr" className="text-xs text-muted">
                {r.debitNoteNumber}
              </span>
            )}
          </div>
        ),
      },
      { key: "total", header: "Value incl. VAT", align: "end", render: (r) => formatMoney(r.total) },
      {
        key: "open",
        header: "Still to deduct",
        align: "end",
        render: (r) => (r.remedy === "debit_note" ? formatMoney(r.openBalance) : <span className="text-muted">—</span>),
      },
      {
        key: "status",
        header: "Status",
        render: (r) =>
          r.status === "awaiting_replacement" && r.source === "from_stock" && canReceive ? (
            <div className="relative z-10">
              <ActionButton action={receiveReplacementAction.bind(null, r.uuid)} label="Replacement received" size="sm" variant="outline" />
            </div>
          ) : (
            <StatusPill tone={r.status === "settled" ? "success" : "warning"}>{SUPPLIER_RETURN_STATUS_LABELS[r.status]}</StatusPill>
          ),
      },
    ]}
  />
);
