import Link from "next/link";
import { ItemCardRow } from "services";
import { PillTone, StatusPill, Table } from "ui";
import { formatDate, formatMoney, formatNumber } from "utils";
import { EntityKind, StockMovementType } from "@/db/enum";
import { RECIPIENT_KIND_LABELS, STOCK_MOVEMENT_TYPE_LABELS } from "@/db/label";
import { entityHref } from "@/lib/entity-href";

type ItemMovementsTableProps = {
  rows: ItemCardRow[];
  unit: string;
};

const MOVEMENT_TONES: Record<StockMovementType, PillTone> = {
  receipt: "success",
  issue: "info",
  transfer_out: "neutral",
  transfer_in: "neutral",
  adjustment: "warning",
  write_off: "danger",
  return: "success",
};

/** The warehouse documents a movement opens — a receipt is reached through its PO instead. */
const LINKED_KINDS: EntityKind[] = ["issue_request", "stock_transfer", "stocktake", "write_off", "asset_custody"];

/** The item card: every movement, newest first, with the balance after it. */
export const ItemMovementsTable = ({ rows, unit }: ItemMovementsTableProps) => (
  <Table
    data={rows}
    rowKey={(r) => r.uuid}
    emptyMessage="No movement yet — the balance starts with the first goods receipt."
    columns={[
      { key: "date", header: "Date", render: (r) => <span className="whitespace-nowrap">{formatDate(r.at)}</span> },
      { key: "type", header: "Type", render: (r) => <StatusPill tone={MOVEMENT_TONES[r.type]}>{STOCK_MOVEMENT_TYPE_LABELS[r.type]}</StatusPill> },
      { key: "warehouse", header: "Warehouse", render: (r) => <span dir="ltr">{r.warehouseCode}</span> },
      {
        key: "ref",
        header: "Reference",
        render: (r) =>
          LINKED_KINDS.includes(r.refKind) ? (
            <Link href={entityHref(r.refKind, r.refUuid)} className="font-medium hover:text-primary" dir="ltr">
              {r.refNumber}
            </Link>
          ) : (
            <span dir="ltr">{r.refNumber}</span>
          ),
      },
      {
        key: "qty",
        header: "Quantity",
        align: "end",
        render: (r) => (
          <span className={`font-medium ${r.qty > 0 ? "text-success" : r.qty < 0 ? "text-danger" : "text-muted"}`} dir="ltr">
            {r.qty > 0 ? "+" : ""}
            {formatNumber(r.qty)}
          </span>
        ),
      },
      { key: "cost", header: "Unit cost", align: "end", render: (r) => formatMoney(r.unitCost) },
      {
        key: "charged",
        header: "Charged to",
        render: (r) =>
          r.chargedTo ? (
            <div className="flex flex-col">
              <span>{r.chargedTo.name}</span>
              <span className="text-xs text-muted">{RECIPIENT_KIND_LABELS[r.chargedTo.kind]}</span>
            </div>
          ) : (
            <span className="text-muted">—</span>
          ),
      },
      {
        key: "balance",
        header: "Balance",
        align: "end",
        render: (r) => (
          <span className="font-medium">
            {formatNumber(r.balance)} <span className="text-xs text-muted">{unit}</span>
          </span>
        ),
      },
    ]}
  />
);
