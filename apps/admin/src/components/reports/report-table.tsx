import Link from "next/link";
import { ReportColumn, ReportRow } from "services";
import { Table } from "ui";
import { formatReportCell } from "@/lib/format-report-cell";

type ReportTableProps = {
  columns: ReportColumn[];
  rows: ReportRow[];
};

const NUMERIC = ["money", "number", "percent"];

/** Any report's rows: numbers to the end, the first cell linking where the row has a page, totals in medium. */
export const ReportTable = ({ columns, rows }: ReportTableProps) => (
  <Table
    data={rows}
    rowKey={(r) => r.key}
    pageSize={50}
    emptyMessage="Nothing to report."
    columns={columns.map((column, index) => ({
      key: column.key,
      header: column.header,
      align: NUMERIC.includes(column.kind) ? ("end" as const) : ("start" as const),
      wrap: column.wrap,
      render: (row: ReportRow) => {
        const text = formatReportCell(row.cells[column.key] ?? null, column.kind);
        const weight = row.emphasis ? "font-medium" : "";
        const negative = column.kind === "money" && Number(row.cells[column.key]) < 0 ? "text-danger" : "";
        return index === 0 && row.href ? (
          <Link href={row.href} className={`text-ink after:absolute after:inset-0 hover:text-primary ${weight}`}>
            {text}
          </Link>
        ) : (
          <span className={`${weight} ${negative}`}>{text}</span>
        );
      },
    }))}
  />
);
