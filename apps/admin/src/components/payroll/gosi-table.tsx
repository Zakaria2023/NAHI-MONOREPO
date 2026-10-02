import { Payslip } from "services";
import { Table } from "ui";
import { formatMoney } from "utils";
import { NATIONALITY_LABELS } from "@/db/label";

type GosiTableProps = {
  payslips: Payslip[];
};

export const GosiTable = ({ payslips }: GosiTableProps) => (
  <Table
    data={payslips}
    rowKey={(p) => p.employeeUuid}
    pageSize={15}
    columns={[
      { key: "employee", header: "Employee", render: (p) => p.employeeName },
      { key: "nationality", header: "Nationality", render: (p) => NATIONALITY_LABELS[p.nationality] },
      { key: "wage", header: "Contributory wage", align: "end", render: (p) => formatMoney(p.basic + p.housing) },
      { key: "employee-share", header: "Employee share", align: "end", render: (p) => formatMoney(p.gosiEmployee) },
      { key: "employer-share", header: "Company share", align: "end", render: (p) => formatMoney(p.gosiEmployer) },
      { key: "total", header: "Total", align: "end", render: (p) => <span className="font-medium">{formatMoney(p.gosiEmployee + p.gosiEmployer)}</span> },
    ]}
  />
);
