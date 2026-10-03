import { EmployeeRow } from "services";
import { StatusPill, Table } from "ui";
import { formatDate, formatMoney } from "utils";
import { EMPLOYMENT_TYPE_LABELS, NATIONALITY_LABELS, STAFF_ROLE_LABELS } from "@/db/label";

type EmployeesTableProps = {
  employees: EmployeeRow[];
};

export const EmployeesTable = ({ employees }: EmployeesTableProps) => (
  <Table
    data={employees}
    rowKey={(e) => e.uuid}
    columns={[
      {
        key: "name",
        header: "Employee",
        render: (e) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">{e.name}</span>
            <span dir="ltr" className="text-xs text-muted">
              {e.code}
            </span>
          </div>
        ),
      },
      { key: "title", header: "Job title", render: (e) => e.jobTitle },
      { key: "nationality", header: "Nationality", render: (e) => NATIONALITY_LABELS[e.nationality] },
      {
        key: "type",
        header: "Pay",
        render: (e) => <StatusPill tone={e.employmentType === "daily" ? "warning" : "info"}>{EMPLOYMENT_TYPE_LABELS[e.employmentType]}</StatusPill>,
      },
      {
        key: "salary",
        header: "Basic / day rate",
        align: "end",
        render: (e) => (e.employmentType === "daily" ? `${formatMoney(e.dailyRate ?? 0)} / day` : formatMoney(e.basicSalary)),
      },
      {
        key: "allowances",
        header: "Allowances",
        align: "end",
        render: (e) => (e.employmentType === "daily" ? <span className="text-muted">—</span> : formatMoney(e.housingAllowance + e.transportAllowance)),
      },
      { key: "cost", header: "Monthly cost", align: "end", render: (e) => formatMoney(e.monthlyCost) },
      { key: "project", header: "Default project", render: (e) => <span dir="ltr">{e.defaultProjectCode ?? "Head office"}</span> },
      { key: "bank", header: "Bank", render: (e) => <span className="text-secondary">{e.bankName}</span> },
      { key: "joined", header: "Joined", render: (e) => formatDate(e.joinedAt) },
      {
        key: "account",
        header: "Account",
        render: (e) =>
          e.accountEmail ? (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm">{e.accountEmail}</span>
              {e.accountRole && <span className="text-xs text-muted">{STAFF_ROLE_LABELS[e.accountRole]}</span>}
            </div>
          ) : (
            <span className="text-faint">No account</span>
          ),
      },
    ]}
  />
);
