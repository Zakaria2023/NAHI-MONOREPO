import Link from "next/link";
import { FixedAssetRow } from "services";
import { StatusPill, Table } from "ui";
import { formatDate, formatMoney } from "utils";
import { ASSET_CATEGORY_LABELS, ASSET_STATUS_LABELS } from "@/db/label";

type AssetsTableProps = {
  assets: FixedAssetRow[];
};

export const AssetsTable = ({ assets }: AssetsTableProps) => (
  <Table
    data={assets}
    rowKey={(a) => a.uuid}
    emptyMessage="No assets here."
    columns={[
      {
        key: "number",
        header: "Asset",
        render: (a) => (
          <div className="flex flex-col gap-0.5">
            <Link href={`/finance/assets/${a.uuid}`} className="font-medium text-ink after:absolute after:inset-0">
              {a.name}
            </Link>
            <span dir="ltr" className="text-xs text-muted">
              {a.number} · {a.serialNumber}
            </span>
          </div>
        ),
      },
      { key: "category", header: "Category", render: (a) => <span className="text-secondary">{ASSET_CATEGORY_LABELS[a.category]}</span> },
      { key: "bought", header: "Purchased", render: (a) => formatDate(a.purchaseDate) },
      { key: "cost", header: "Cost", align: "end", render: (a) => formatMoney(a.cost) },
      { key: "accumulated", header: "Depreciation to date", align: "end", render: (a) => formatMoney(a.accumulated) },
      { key: "book", header: "Book value", align: "end", render: (a) => <span className="font-medium">{formatMoney(a.status === "disposed" ? 0 : a.bookValue)}</span> },
      { key: "holder", header: "Held by", render: (a) => a.holderLabel },
      { key: "project", header: "Charged to", render: (a) => <span dir="ltr">{a.projectCode ?? "Head office"}</span> },
      {
        key: "status",
        header: "Status",
        render: (a) =>
          a.status === "disposed" ? (
            <StatusPill>{ASSET_STATUS_LABELS[a.status]}</StatusPill>
          ) : (
            <StatusPill tone={a.countedThisYear ? "success" : "warning"}>{a.countedThisYear ? "Counted this year" : "Count due"}</StatusPill>
          ),
      },
    ]}
  />
);
