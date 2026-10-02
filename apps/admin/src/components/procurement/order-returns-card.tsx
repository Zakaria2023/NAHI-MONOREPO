import { PurchaseOrderDetail } from "services";
import { Card, DropdownOption, StatusPill, Table } from "ui";
import { formatDate, formatMoney } from "utils";
import { SUPPLIER_RETURN_REMEDY_LABELS, SUPPLIER_RETURN_SOURCE_LABELS, SUPPLIER_RETURN_STATUS_LABELS } from "@/db/label";
import { returnToSupplierAction } from "@/app/(dashboard)/procurement/orders/[uuid]/actions";
import { SupplierReturnForm } from "./supplier-return-form";

type OrderReturnsCardProps = {
  detail: PurchaseOrderDetail;
  warehouses: DropdownOption[];
};

/** Goods sent back on this PO, and the form to send back more from stock. */
export const OrderReturnsCard = ({ detail, warehouses }: OrderReturnsCardProps) => (
  <Card
    title="Returns to the supplier"
    description="Rejected at receipt, or found faulty in stock — against a debit note or a replacement"
  >
    <div className="flex flex-col gap-6">
      {detail.returns.length > 0 && (
        <Table
          data={detail.returns}
          rowKey={(r) => r.uuid}
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
            { key: "source", header: "Source", render: (r) => SUPPLIER_RETURN_SOURCE_LABELS[r.source] },
            { key: "reason", header: "Reason", wrap: true, render: (r) => r.reason },
            {
              key: "remedy",
              header: "Remedy",
              render: (r) => (r.debitNoteNumber ? `${SUPPLIER_RETURN_REMEDY_LABELS[r.remedy]} ${r.debitNoteNumber}` : SUPPLIER_RETURN_REMEDY_LABELS[r.remedy]),
            },
            { key: "total", header: "Value", align: "end", render: (r) => formatMoney(r.total) },
            {
              key: "status",
              header: "Status",
              render: (r) => <StatusPill tone={r.status === "settled" ? "success" : "warning"}>{SUPPLIER_RETURN_STATUS_LABELS[r.status]}</StatusPill>,
            },
          ]}
        />
      )}
      <SupplierReturnForm
        action={returnToSupplierAction.bind(null, detail.po.uuid)}
        warehouses={warehouses}
        items={detail.lines.map((l) => ({ value: l.itemUuid, label: `${l.item.code} — ${l.item.name}` }))}
      />
    </div>
  </Card>
);
