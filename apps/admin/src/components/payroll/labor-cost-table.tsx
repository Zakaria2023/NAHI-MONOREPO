import { LaborCostRow } from "services";
import { Table } from "ui";
import { formatMoney } from "utils";

type LaborCostTableProps = {
  rows: LaborCostRow[];
};

export const LaborCostTable = ({ rows }: LaborCostTableProps) => (
  <Table
    data={rows}
    rowKey={(r) => r.projectUuid ?? "head-office"}
    columns={[
      { key: "code", header: "Project", render: (r) => <span dir="ltr" className="font-medium">{r.projectCode}</span> },
      { key: "name", header: "Name", render: (r) => <span className="text-secondary">{r.projectName}</span> },
      { key: "days", header: "Person-days", align: "end", render: (r) => r.days },
      { key: "amount", header: "Labour cost", align: "end", render: (r) => formatMoney(r.amount) },
    ]}
  />
);
