import Link from "next/link";
import { CUSTODY_SETTLEMENT_DAYS, listCashCustodies } from "services";
import { StatusPill, Table } from "ui";
import { formatDate, formatMoney } from "utils";
import { CashCustodyStatus } from "@/db/enum";
import { CASH_CUSTODY_STATUS_LABELS, STAFF_ROLE_LABELS } from "@/db/label";
import { CASH_CUSTODY_TONES } from "@/lib/status-tones";

type CashCustodyTableProps = {
  status?: CashCustodyStatus;
};

export const CashCustodyTable = async ({ status }: CashCustodyTableProps) => {
  const rows = (await listCashCustodies()).filter((r) => !status || r.status === status);
  return (
    <Table
      data={rows}
      rowKey={(r) => r.uuid}
      emptyMessage="No cash custody here. Request one with “New cash custody”."
      columns={[
        {
          key: "number",
          header: "Number",
          render: (r) => (
            <div className="flex flex-col">
              <Link href={`/custody/${r.uuid}`} className="font-medium after:absolute after:inset-0 hover:text-primary" dir="ltr">
                {r.number}
              </Link>
              <span className="text-xs text-muted">{formatDate(r.createdAt)}</span>
            </div>
          ),
        },
        { key: "employee", header: "Employee", render: (r) => r.employeeName },
        {
          key: "project",
          header: "Project",
          render: (r) => (
            <div className="flex flex-col">
              <span dir="ltr">{r.projectCode}</span>
              <span className="text-xs text-muted">
                {r.city} · WO <span dir="ltr">{r.workOrderNo}</span>
              </span>
            </div>
          ),
        },
        { key: "amount", header: "Amount", align: "end", render: (r) => <span className="font-medium">{formatMoney(r.amount)}</span> },
        { key: "status", header: "Status", render: (r) => <StatusPill tone={CASH_CUSTODY_TONES[r.status]}>{CASH_CUSTODY_STATUS_LABELS[r.status]}</StatusPill> },
        { key: "awaiting", header: "Awaiting", render: (r) => (r.awaiting ? STAFF_ROLE_LABELS[r.awaiting] : <span className="text-muted">—</span>) },
        {
          key: "open",
          header: "Open days",
          align: "end",
          render: (r) =>
            r.openDays === null ? (
              <span className="text-muted">—</span>
            ) : r.openDays > CUSTODY_SETTLEMENT_DAYS ? (
              <StatusPill tone="danger">{r.openDays} days</StatusPill>
            ) : (
              <span>{r.openDays} days</span>
            ),
        },
      ]}
    />
  );
};
