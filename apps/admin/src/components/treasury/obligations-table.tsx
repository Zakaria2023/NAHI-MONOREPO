import { ObligationRow } from "services";
import { StatusPill, Table } from "ui";
import { formatDate, formatMoney, formatPeriod } from "utils";
import { OBLIGATION_KIND_LABELS } from "@/db/label";
import { FormDialog } from "@/components/shared/form-dialog";
import { FilingForm } from "./filing-form";

type ObligationsTableProps = {
  rows: ObligationRow[];
};

const STATUS = {
  filed: { tone: "success", label: "Filed" },
  overdue: { tone: "danger", label: "Overdue" },
  due_soon: { tone: "warning", label: "Due soon" },
  upcoming: { tone: "neutral", label: "Upcoming" },
} as const;

export const ObligationsTable = ({ rows }: ObligationsTableProps) => (
  <Table
    data={rows}
    rowKey={(r) => r.key}
    pageSize={12}
    columns={[
      { key: "kind", header: "Obligation", render: (r) => <span className="font-medium">{OBLIGATION_KIND_LABELS[r.kind]}</span> },
      { key: "period", header: "Month", render: (r) => formatPeriod(r.period) },
      {
        key: "due",
        header: "Due",
        render: (r) => (
          <div className="flex flex-col gap-0.5">
            <span>{formatDate(r.dueAt)}</span>
            {r.status !== "filed" && <span className="text-xs text-muted">{r.daysLeft < 0 ? `${-r.daysLeft} day(s) late` : `in ${r.daysLeft} day(s)`}</span>}
          </div>
        ),
      },
      {
        key: "amount",
        header: "Amount",
        align: "end",
        render: (r) => (r.kind === "vat" && r.amount < 0 ? <span className="text-success">{formatMoney(-r.amount)} refundable</span> : formatMoney(r.amount)),
      },
      { key: "status", header: "Status", render: (r) => <StatusPill tone={STATUS[r.status].tone}>{STATUS[r.status].label}</StatusPill> },
      {
        key: "filing",
        header: "Filing",
        render: (r) =>
          r.filing ? (
            <div className="flex flex-col gap-0.5">
              <span dir="ltr">{r.filing.reference}</span>
              <span className="text-xs text-muted">
                {r.filing.by} · {formatDate(r.filing.filedAt)}
              </span>
            </div>
          ) : (
            <div className="relative z-10">
              <FormDialog label={r.kind === "vat" ? "Record filing" : "Record payment"} title={`${OBLIGATION_KIND_LABELS[r.kind]} — ${formatPeriod(r.period)}`} description="The reference from the portal" size="sm" variant="primary">
                <FilingForm kind={r.kind} period={r.period} />
              </FormDialog>
            </div>
          ),
      },
    ]}
  />
);
