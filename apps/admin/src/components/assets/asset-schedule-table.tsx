import { ScheduleYear } from "services";
import { Table } from "ui";
import { formatMoney } from "utils";

type AssetScheduleTableProps = {
  schedule: ScheduleYear[];
};

export const AssetScheduleTable = ({ schedule }: AssetScheduleTableProps) => (
  <Table
    data={schedule}
    rowKey={(y) => String(y.year)}
    columns={[
      { key: "year", header: "Year", render: (y) => <span className="font-medium">{y.year}</span> },
      { key: "opening", header: "Opening book value", align: "end", render: (y) => formatMoney(y.opening) },
      { key: "charge", header: "Depreciation", align: "end", render: (y) => formatMoney(y.charge) },
      { key: "closing", header: "Closing book value", align: "end", render: (y) => formatMoney(y.closing) },
    ]}
  />
);
