import { LineView } from "services";
import { Table } from "ui";
import { formatNumber } from "utils";
import { ItemKindPill } from "./item-kind-pill";

type StockLinesTableProps = {
  lines: LineView[];
  /** Header of the balance column — "Available in WH-RUH". */
  availableLabel: string;
  /** Hide the balance once the document has moved the stock. */
  showAvailable?: boolean;
};

/** A document's item lines against the balance of the warehouse they come out of. */
export const StockLinesTable = ({ lines, availableLabel, showAvailable = true }: StockLinesTableProps) => (
  <Table
    data={lines}
    rowKey={(l) => l.itemUuid}
    emptyMessage="No lines."
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
      { key: "kind", header: "Kind", render: (l) => <ItemKindPill kind={l.item.kind} /> },
      {
        key: "qty",
        header: "Quantity",
        align: "end",
        render: (l) => (
          <span>
            {formatNumber(l.qty)} <span className="text-xs text-muted">{l.item.unit}</span>
          </span>
        ),
      },
      ...(showAvailable
        ? [
            {
              key: "available",
              header: availableLabel,
              align: "end" as const,
              render: (l: LineView) => (
                <span className={l.available < l.qty ? "text-danger" : "text-secondary"}>
                  {formatNumber(l.available)} <span className="text-xs text-muted">{l.item.unit}</span>
                </span>
              ),
            },
          ]
        : []),
    ]}
  />
);
