import Link from "next/link";
import { Payslip } from "services";
import { Table } from "ui";
import { formatMoney } from "utils";

type PayslipsTableProps = {
  runUuid: string;
  payslips: Payslip[];
};

export const PayslipsTable = ({ runUuid, payslips }: PayslipsTableProps) => (
  <Table
    data={payslips}
    rowKey={(p) => p.employeeUuid}
    pageSize={15}
    columns={[
      {
        key: "employee",
        header: "Employee",
        render: (p) => (
          <div className="flex flex-col gap-0.5">
            <Link href={`/payroll/runs/${runUuid}/payslips/${p.employeeUuid}`} className="font-medium text-ink after:absolute after:inset-0">
              {p.employeeName}
            </Link>
            <span className="text-xs text-muted">{p.jobTitle}</span>
          </div>
        ),
      },
      { key: "days", header: "Days", align: "end", render: (p) => p.workedDays },
      { key: "basic", header: "Basic", align: "end", render: (p) => formatMoney(p.basic) },
      { key: "allowances", header: "Allowances", align: "end", render: (p) => formatMoney(p.housing + p.transport) },
      { key: "overtime", header: "Overtime", align: "end", render: (p) => (p.overtime > 0 ? formatMoney(p.overtime) : "—") },
      { key: "gross", header: "Gross", align: "end", render: (p) => formatMoney(p.gross) },
      {
        key: "deductions",
        header: "Deductions",
        align: "end",
        render: (p) => (p.absenceDeduction + p.gosiEmployee > 0 ? formatMoney(p.absenceDeduction + p.gosiEmployee) : "—"),
      },
      { key: "net", header: "Net", align: "end", render: (p) => <span className="font-medium">{formatMoney(p.net)}</span> },
    ]}
  />
);
