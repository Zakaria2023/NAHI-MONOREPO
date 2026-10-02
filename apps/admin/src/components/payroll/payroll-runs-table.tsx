import Link from "next/link";
import { PayrollRunRow } from "services";
import { StatusPill, Table } from "ui";
import { formatDate, formatMoney, formatPeriod } from "utils";
import { PAYROLL_RUN_STATUS_LABELS, STAFF_ROLE_LABELS } from "@/db/label";
import { PAYROLL_TONES } from "@/lib/status-tones";

type PayrollRunsTableProps = {
  runs: PayrollRunRow[];
};

export const PayrollRunsTable = ({ runs }: PayrollRunsTableProps) => (
  <Table
    data={runs}
    rowKey={(r) => r.uuid}
    emptyMessage="No payroll has been run yet."
    columns={[
      {
        key: "number",
        header: "Run",
        render: (r) => (
          <div className="flex flex-col gap-0.5">
            <Link href={`/payroll/runs/${r.uuid}`} dir="ltr" className="font-medium text-ink after:absolute after:inset-0">
              {r.number}
            </Link>
            <span className="text-xs text-muted">{formatPeriod(r.period)}</span>
          </div>
        ),
      },
      { key: "employees", header: "Employees", align: "end", render: (r) => r.totals.employees },
      { key: "gross", header: "Gross", align: "end", render: (r) => formatMoney(r.totals.gross) },
      { key: "deductions", header: "Deductions", align: "end", render: (r) => formatMoney(r.totals.deductions) },
      { key: "net", header: "Net pay", align: "end", render: (r) => <span className="font-medium">{formatMoney(r.totals.net)}</span> },
      { key: "gosi", header: "Employer GOSI", align: "end", render: (r) => formatMoney(r.totals.gosiEmployer) },
      { key: "status", header: "Status", render: (r) => <StatusPill tone={PAYROLL_TONES[r.status]}>{PAYROLL_RUN_STATUS_LABELS[r.status]}</StatusPill> },
      {
        key: "next",
        header: "Awaiting / paid",
        render: (r) =>
          r.paidAt ? (
            <span className="text-secondary">Paid {formatDate(r.paidAt)}</span>
          ) : r.awaiting ? (
            STAFF_ROLE_LABELS[r.awaiting]
          ) : (
            "Payment"
          ),
      },
    ]}
  />
);
