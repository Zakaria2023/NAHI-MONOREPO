import { clearanceApproverBlocker, listEmployeeCustody } from "services";
import { Table } from "ui";
import { formatMoney } from "utils";
import { getCurrentStaff } from "@/lib/server/auth";
import { EmployeeClearance } from "./employee-clearance";

/** The custody statement per employee: open cash, assets held, and whether they can be cleared. */
export const EmployeeCustodyTable = async () => {
  const [rows, actor] = await Promise.all([listEmployeeCustody(), getCurrentStaff()]);
  const approverBlocker = clearanceApproverBlocker(actor);
  return (
    <Table
      data={rows}
      rowKey={(r) => r.employeeName}
      emptyMessage="No employee holds custody."
      columns={[
        { key: "employee", header: "Employee", render: (r) => <span className="font-medium">{r.employeeName}</span> },
        {
          key: "cash",
          header: "Open cash custody",
          align: "end",
          render: (r) =>
            r.openCashCount === 0 ? (
              <span className="text-muted">—</span>
            ) : (
              <div className="flex flex-col items-end">
                <span className="font-medium">{formatMoney(r.openCash)}</span>
                <span className="text-xs text-muted">{r.openCashCount} open</span>
              </div>
            ),
        },
        {
          key: "assets",
          header: "Assets held",
          align: "end",
          render: (r) => (r.assetCount === 0 ? <span className="text-muted">—</span> : `${r.assetCount} item(s)`),
        },
        { key: "clearance", header: "Clearance", render: (r) => <EmployeeClearance summary={r} approverBlocker={approverBlocker} /> },
      ]}
    />
  );
};
