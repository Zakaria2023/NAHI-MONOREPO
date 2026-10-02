import { BankAccountDetail } from "services";
import { Table } from "ui";
import { formatDate, formatMoney } from "utils";

type BankMovementsTableProps = {
  movements: BankAccountDetail["movements"];
};

export const BankMovementsTable = ({ movements }: BankMovementsTableProps) => (
  <Table
    data={movements}
    rowKey={(m) => m.key}
    pageSize={15}
    columns={[
      { key: "at", header: "Date", render: (m) => formatDate(m.at) },
      { key: "description", header: "Description", wrap: true, render: (m) => m.description },
      { key: "reference", header: "Reference", render: (m) => <span dir="ltr" className="text-secondary">{m.reference}</span> },
      {
        key: "in",
        header: "In",
        align: "end",
        render: (m) => (m.amount > 0 ? <span className="text-success">{formatMoney(m.amount)}</span> : <span className="text-muted">—</span>),
      },
      { key: "out", header: "Out", align: "end", render: (m) => (m.amount < 0 ? formatMoney(-m.amount) : <span className="text-muted">—</span>) },
      { key: "balance", header: "Balance", align: "end", render: (m) => <span className="font-medium">{formatMoney(m.balance)}</span> },
    ]}
  />
);
