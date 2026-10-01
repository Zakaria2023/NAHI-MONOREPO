import { ReactNode } from "react";
import { AgeingBuckets } from "services";
import { Table } from "ui";
import { formatMoney, round2, sumBy } from "utils";

type AgeingRow = {
  key: string;
  label: ReactNode;
  buckets: AgeingBuckets;
};

type AgeingTableProps = {
  header: string;
  rows: AgeingRow[];
  emptyMessage: string;
};

const BUCKETS: { key: keyof AgeingBuckets; header: string }[] = [
  { key: "current", header: "Current" },
  { key: "d1to30", header: "1–30" },
  { key: "d31to60", header: "31–60" },
  { key: "d61to90", header: "61–90" },
  { key: "over90", header: "90+" },
  { key: "total", header: "Total" },
];

/** Outstanding amounts by days past due, with a totals row. */
export const AgeingTable = ({ header, rows, emptyMessage }: AgeingTableProps) => {
  const total = (key: keyof AgeingBuckets) => round2(sumBy(rows, (r) => r.buckets[key]));
  const totals: AgeingBuckets = {
    current: total("current"),
    d1to30: total("d1to30"),
    d31to60: total("d31to60"),
    d61to90: total("d61to90"),
    over90: total("over90"),
    total: total("total"),
  };
  const data = rows.length > 0 ? [...rows, { key: "__total", label: <span className="font-medium">Total</span>, buckets: totals }] : [];
  return (
    <Table
      data={data}
      rowKey={(r) => r.key}
      emptyMessage={emptyMessage}
      columns={[
        { key: "label", header, render: (r) => r.label },
        ...BUCKETS.map((bucket) => ({
          key: bucket.key,
          header: bucket.header,
          align: "end" as const,
          render: (r: AgeingRow) => {
            const amount = r.buckets[bucket.key];
            const late = bucket.key !== "current" && bucket.key !== "total" && amount > 0;
            return amount === 0 ? (
              <span className="text-faint">—</span>
            ) : (
              <span className={`${late ? "text-danger" : ""} ${bucket.key === "total" || r.key === "__total" ? "font-medium" : ""}`}>{formatMoney(amount)}</span>
            );
          },
        })),
      ]}
    />
  );
};
