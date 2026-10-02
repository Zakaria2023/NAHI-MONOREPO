import { StatementCheckRow } from "services";
import { StatusPill, Table } from "ui";
import { formatDate, formatMoney } from "utils";

type StatementChecksProps = {
  checks: StatementCheckRow[];
};

/** Each time the supplier's own statement was matched against ours, and what differed. */
export const StatementChecks = ({ checks }: StatementChecksProps) => (
  <Table
    data={checks}
    rowKey={(c) => c.uuid}
    emptyMessage="Not matched against the supplier's statement yet."
    columns={[
      { key: "asOf", header: "Their statement", render: (c) => formatDate(c.asOf) },
      { key: "reported", header: "They show", align: "end", render: (c) => formatMoney(c.reportedBalance) },
      { key: "system", header: "We show", align: "end", render: (c) => formatMoney(c.systemBalance) },
      {
        key: "difference",
        header: "Difference",
        align: "end",
        render: (c) =>
          c.difference === 0 ? <StatusPill tone="success">Agrees</StatusPill> : <span className="font-medium text-danger">{formatMoney(c.difference)}</span>,
      },
      { key: "note", header: "Note", wrap: true, render: (c) => c.note ?? "—" },
      { key: "by", header: "Checked", render: (c) => <span className="text-secondary">{`${c.by} · ${formatDate(c.at)}`}</span> },
    ]}
  />
);
