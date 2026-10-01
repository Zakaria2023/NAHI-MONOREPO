import { ExtractLine } from "services";
import { Table } from "ui";
import { formatMoney, formatNumber, round2, sumBy } from "utils";

type ExtractLinesTableProps = {
  lines: ExtractLine[];
};

type LineRow = ExtractLine & {
  key: string;
  amount: number;
  isTotal: boolean;
};

export const ExtractLinesTable = ({ lines }: ExtractLinesTableProps) => {
  const rows: LineRow[] = lines.map((line, index) => ({
    ...line,
    key: String(index),
    amount: round2(line.qty * line.unitRate),
    isTotal: false,
  }));
  const total: LineRow = {
    description: "Gross",
    unit: "",
    qty: 0,
    unitRate: 0,
    key: "total",
    amount: round2(sumBy(rows, (r) => r.amount)),
    isTotal: true,
  };
  return (
    <Table
      data={[...rows, total]}
      rowKey={(r) => r.key}
      columns={[
        { key: "description", header: "Description", wrap: true, render: (r) => <span className={r.isTotal ? "font-medium" : ""}>{r.description}</span> },
        { key: "unit", header: "Unit", render: (r) => r.unit },
        { key: "qty", header: "Quantity", align: "end", render: (r) => (r.isTotal ? "" : formatNumber(r.qty)) },
        { key: "unitRate", header: "Unit rate", align: "end", render: (r) => (r.isTotal ? "" : formatMoney(r.unitRate)) },
        { key: "amount", header: "Amount", align: "end", render: (r) => <span className={r.isTotal ? "font-medium" : ""}>{formatMoney(r.amount)}</span> },
      ]}
    />
  );
};
