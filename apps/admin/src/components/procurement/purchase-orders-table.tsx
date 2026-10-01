import Link from "next/link";
import { listPurchaseOrders } from "services";
import { StatusPill, Table } from "ui";
import { formatDate, formatMoney } from "utils";
import { PurchaseOrderStatus } from "@/db/enum";
import { PURCHASE_ORDER_STATUS_LABELS, STAFF_ROLE_LABELS } from "@/db/label";
import { PO_TONES } from "@/lib/status-tones";

type PurchaseOrdersTableProps = {
  group?: string;
  search?: string;
};

const GROUPS: Record<string, PurchaseOrderStatus[]> = {
  approval: ["pending_approval"],
  open: ["approved", "sent", "partially_received"],
  late: ["sent", "partially_received"],
  closed: ["received", "cancelled", "rejected"],
};

export const PurchaseOrdersTable = async ({ group, search }: PurchaseOrdersTableProps) => {
  const statuses = group ? GROUPS[group] : undefined;
  const term = search?.trim().toLowerCase();
  const orders = (await listPurchaseOrders()).filter(
    (po) =>
      (!statuses || statuses.includes(po.status)) &&
      (group !== "late" || po.late) &&
      (!term || [po.number, po.supplierName, po.projectCode].some((v) => v.toLowerCase().includes(term))),
  );
  return (
    <Table
      data={orders}
      rowKey={(po) => po.uuid}
      emptyMessage="No purchase order here. A PO is raised automatically when the last approver signs off a quotation."
      columns={[
        {
          key: "number",
          header: "PO",
          render: (po) => (
            <div className="flex flex-col gap-0.5">
              <Link
                href={`/procurement/orders/${po.uuid}`}
                dir="ltr"
                className="w-fit font-medium text-ink after:absolute after:inset-0 hover:text-primary"
              >
                {po.number}
              </Link>
              <span className="text-xs text-muted">{formatDate(po.createdAt)}</span>
            </div>
          ),
        },
        { key: "supplier", header: "Supplier", render: (po) => po.supplierName },
        { key: "project", header: "Project", render: (po) => <span dir="ltr">{po.projectCode}</span> },
        {
          key: "total",
          header: "Total incl. VAT",
          align: "end",
          render: (po) => <span className="whitespace-nowrap">{formatMoney(po.total)}</span>,
        },
        {
          key: "status",
          header: "Status",
          render: (po) => <StatusPill tone={PO_TONES[po.status]}>{PURCHASE_ORDER_STATUS_LABELS[po.status]}</StatusPill>,
        },
        {
          key: "delivery",
          header: "Expected delivery",
          render: (po) =>
            po.expectedDeliveryAt ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="whitespace-nowrap">{formatDate(po.expectedDeliveryAt)}</span>
                {po.late && <StatusPill tone="danger">Late</StatusPill>}
              </div>
            ) : (
              <span className="text-xs text-muted">Set when sent</span>
            ),
        },
        {
          key: "awaiting",
          header: "Awaiting",
          render: (po) =>
            po.awaiting ? <span className="text-secondary">{STAFF_ROLE_LABELS[po.awaiting]}</span> : <span className="text-muted">—</span>,
        },
      ]}
    />
  );
};
