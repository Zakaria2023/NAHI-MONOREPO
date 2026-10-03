import Link from "next/link";
import { listStock, listWarehouses, StockRow } from "services";
import { StatusPill, Table } from "ui";
import { formatMoney, formatNumber } from "utils";
import { ITEM_CATEGORY_LABELS } from "@/db/label";
import { ItemKindPill } from "./item-kind-pill";

type StockTableProps = {
  belowOnly: boolean;
  search?: string;
};

/** The stock balance report: one column per warehouse, then the total and its value. */
export const StockTable = async ({ belowOnly, search }: StockTableProps) => {
  const [rows, warehouses] = await Promise.all([listStock(), listWarehouses()]);
  const query = search?.trim().toLowerCase() ?? "";
  const shown = rows.filter(
    (r) =>
      (!belowOnly || r.belowReorder) &&
      (!query || r.code.toLowerCase().includes(query) || r.name.toLowerCase().includes(query)),
  );
  return (
    <Table
      data={shown}
      rowKey={(r) => r.uuid}
      emptyMessage={belowOnly ? "No item is under its reorder level." : "No item matches. Add one with New item."}
      columns={[
        {
          key: "item",
          header: "Item",
          render: (r) => (
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/warehouse/items/${r.uuid}`} className="font-medium after:absolute after:inset-0 hover:text-primary" dir="ltr">
                  {r.code}
                </Link>
                <ItemKindPill kind={r.kind} />
                {r.belowReorder && <StatusPill tone="warning">Below reorder ({formatNumber(r.reorderLevel)})</StatusPill>}
              </div>
              <span className="text-xs text-muted">
                {r.name} · {ITEM_CATEGORY_LABELS[r.category]}
              </span>
            </div>
          ),
        },
        ...warehouses.map((w) => ({
          key: w.uuid,
          header: w.code,
          align: "end" as const,
          render: (r: StockRow) => {
            const qty = r.byWarehouse[w.uuid] ?? 0;
            return <span className={qty === 0 ? "text-faint" : "text-secondary"}>{formatNumber(qty)}</span>;
          },
        })),
        {
          key: "total",
          header: "Total",
          align: "end",
          render: (r) => <span className={`font-medium ${r.belowReorder ? "text-warning" : ""}`}>{formatNumber(r.total)}</span>,
        },
        { key: "unit", header: "Unit", render: (r) => <span className="text-muted">{r.unit}</span> },
        { key: "cost", header: "Average cost", align: "end", render: (r) => formatMoney(r.averageCost) },
        { key: "value", header: "Value", align: "end", render: (r) => <span className="font-medium">{formatMoney(r.value)}</span> },
      ]}
    />
  );
};
