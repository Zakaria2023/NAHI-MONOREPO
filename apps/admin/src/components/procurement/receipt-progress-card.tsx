import { PurchaseOrderDetail } from "services";
import { Card, Table } from "ui";
import { formatNumber, round2 } from "utils";
import { ProgressBar } from "@/components/shared/progress-bar";

type ReceiptProgressCardProps = {
  detail: PurchaseOrderDetail;
};

/** How much of each line has been received and accepted so far. */
export const ReceiptProgressCard = ({ detail }: ReceiptProgressCardProps) => (
  <Card title="Receipt progress" description="Only accepted quantities count against the order; rejected goods go back to the supplier">
    <Table
      data={detail.receiptState}
      rowKey={(s) => s.itemUuid}
      columns={[
        {
          key: "item",
          header: "Item",
          render: (s) => (
            <div className="flex flex-col gap-0.5">
              <span dir="ltr" className="w-fit text-xs text-muted">
                {s.item.code}
              </span>
              <span>{s.item.name}</span>
            </div>
          ),
        },
        { key: "ordered", header: "Ordered", align: "end", render: (s) => `${formatNumber(s.ordered)} ${s.item.unit}` },
        { key: "received", header: "Received", align: "end", render: (s) => formatNumber(s.received) },
        { key: "rejected", header: "Rejected", align: "end", render: (s) => formatNumber(round2(s.received - s.accepted)) },
        { key: "accepted", header: "Accepted", align: "end", render: (s) => formatNumber(s.accepted) },
        { key: "outstanding", header: "Outstanding", align: "end", render: (s) => formatNumber(s.outstanding) },
        {
          key: "progress",
          header: "Progress",
          render: (s) => (
            <div className="w-28">
              <ProgressBar value={s.ordered > 0 ? s.accepted / s.ordered : 0} />
            </div>
          ),
        },
      ]}
    />
  </Card>
);
