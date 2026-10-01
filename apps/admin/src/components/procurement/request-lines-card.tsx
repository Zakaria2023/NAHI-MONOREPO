import { PurchaseRequestDetail } from "services";
import { Card, StatusPill, Table } from "ui";
import { formatDate, formatMoney, formatNumber, round2 } from "utils";

type RequestLinesCardProps = {
  detail: PurchaseRequestDetail;
};

export const RequestLinesCard = ({ detail }: RequestLinesCardProps) => (
  <Card title="Items" description="What is requested, by when, and what the system holds today in all warehouses">
    <div className="flex flex-col gap-3">
      <Table
        data={detail.lines}
        rowKey={(l) => l.itemUuid}
        columns={[
          {
            key: "item",
            header: "Item",
            render: (l) => (
              <div className="flex flex-col gap-0.5">
                <span dir="ltr" className="w-fit text-xs text-muted">
                  {l.item.code}
                </span>
                <span>{l.item.name}</span>
              </div>
            ),
          },
          { key: "qty", header: "Qty", align: "end", render: (l) => `${formatNumber(l.qty)} ${l.item.unit}` },
          { key: "price", header: "Est. unit price", align: "end", render: (l) => formatMoney(l.estUnitPrice) },
          { key: "total", header: "Est. total", align: "end", render: (l) => formatMoney(round2(l.qty * l.estUnitPrice)) },
          { key: "date", header: "Needed by", render: (l) => <span className="whitespace-nowrap">{formatDate(l.expectedDate)}</span> },
          {
            key: "stock",
            header: "In stock",
            align: "end",
            render: (l) => (
              <div className="flex flex-col items-end gap-1">
                <span>{formatNumber(l.inStock)}</span>
                <StatusPill tone={l.inStock >= l.qty ? "success" : "warning"}>{l.inStock >= l.qty ? "Covered" : "Short"}</StatusPill>
              </div>
            ),
          },
        ]}
      />
      <div className="flex justify-end gap-6 px-4 text-sm">
        <span className="text-muted">Estimated total</span>
        <span className="font-medium text-ink">{formatMoney(detail.estimate)}</span>
      </div>
    </div>
  </Card>
);
