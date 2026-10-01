import { PurchaseOrderDetail, Warehouse } from "services";
import { Card, EmptyState, StatusPill, Table } from "ui";
import { formatDate, formatNumber, round2 } from "utils";

type ReceiptsCardProps = {
  detail: PurchaseOrderDetail;
  warehouses: Warehouse[];
};

/** Every goods receipt note (GRN) posted against the PO. */
export const ReceiptsCard = ({ detail, warehouses }: ReceiptsCardProps) => (
  <Card title="Goods receipts" description="Each delivery counted at the warehouse, with what was accepted and why anything was rejected">
    {detail.receipts.length === 0 ? (
      <EmptyState title="Nothing received yet">
        The storekeeper posts a goods receipt when the delivery arrives; accepted quantities go straight into stock.
      </EmptyState>
    ) : (
      <div className="flex flex-col gap-5">
        {detail.receipts.map((receipt) => {
          const warehouse = warehouses.find((w) => w.uuid === receipt.warehouseUuid);
          return (
            <section key={receipt.uuid} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span dir="ltr" className="font-medium text-ink">
                  {receipt.number}
                </span>
                <span className="text-muted">{formatDate(receipt.receivedAt)}</span>
                <span className="text-muted">by {receipt.receivedBy}</span>
                {warehouse && <StatusPill>{warehouse.code} — {warehouse.name}</StatusPill>}
              </div>
              <Table
                data={receipt.lines}
                rowKey={(l) => l.itemUuid}
                columns={[
                  {
                    key: "item",
                    header: "Item",
                    render: (l) => {
                      const item = detail.lines.find((p) => p.itemUuid === l.itemUuid)?.item;
                      return (
                        <span>
                          <span dir="ltr" className="text-muted">
                            {item?.code}
                          </span>{" "}
                          {item?.name}
                        </span>
                      );
                    },
                  },
                  { key: "received", header: "Received", align: "end", render: (l) => formatNumber(l.receivedQty) },
                  { key: "accepted", header: "Accepted", align: "end", render: (l) => formatNumber(l.acceptedQty) },
                  {
                    key: "rejected",
                    header: "Rejected",
                    align: "end",
                    render: (l) => {
                      const rejected = round2(l.receivedQty - l.acceptedQty);
                      return rejected > 0 ? <StatusPill tone="danger">{formatNumber(rejected)}</StatusPill> : <span className="text-muted">—</span>;
                    },
                  },
                  {
                    key: "reason",
                    header: "Reason", wrap: true,
                    render: (l) => (l.rejectionReason ? <span className="text-secondary">{l.rejectionReason}</span> : <span className="text-muted">—</span>),
                  },
                ]}
              />
            </section>
          );
        })}
      </div>
    )}
  </Card>
);
