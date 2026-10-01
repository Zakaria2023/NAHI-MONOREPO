import { StocktakeDetail } from "services";
import { Table } from "ui";
import { formatNumber } from "utils";

type StocktakeLinesTableProps = {
  lines: StocktakeDetail["lines"];
};

/** Book against actual for every counted item, the difference coloured by its sign. */
export const StocktakeLinesTable = ({ lines }: StocktakeLinesTableProps) => (
  <Table
    data={lines}
    rowKey={(l) => l.itemUuid}
    emptyMessage="No item counted."
    columns={[
      {
        key: "item",
        header: "Item",
        render: (l) => (
          <div className="flex flex-col">
            <span className="font-medium" dir="ltr">
              {l.item.code}
            </span>
            <span className="text-xs text-muted">{l.item.name}</span>
          </div>
        ),
      },
      { key: "unit", header: "Unit", render: (l) => <span className="text-muted">{l.item.unit}</span> },
      { key: "book", header: "Book", align: "end", render: (l) => formatNumber(l.bookQty) },
      { key: "actual", header: "Actual", align: "end", render: (l) => formatNumber(l.actualQty) },
      {
        key: "difference",
        header: "Difference",
        align: "end",
        render: (l) => (
          <span className={`font-medium ${l.difference > 0 ? "text-success" : l.difference < 0 ? "text-danger" : "text-muted"}`} dir="ltr">
            {l.difference > 0 ? "+" : ""}
            {formatNumber(l.difference)}
          </span>
        ),
      },
    ]}
  />
);
