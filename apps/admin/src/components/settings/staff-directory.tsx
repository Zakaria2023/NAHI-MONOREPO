import { listStaff } from "services";
import { Table } from "ui";
import { REGION_LABELS, STAFF_ROLE_LABELS } from "@/db/label";

export const StaffDirectory = async () => {
  const staff = await listStaff();
  return (
    <Table
      data={staff}
      rowKey={(u) => u.uuid}
      columns={[
        { key: "name", header: "Name", render: (u) => <span className="font-medium">{u.name}</span> },
        { key: "role", header: "Role", render: (u) => STAFF_ROLE_LABELS[u.role] },
        { key: "region", header: "Region", render: (u) => REGION_LABELS[u.region] },
        { key: "email", header: "Signs in with", render: (u) => <span className="text-muted">{u.email}</span> },
        { key: "payroll", header: "On the payroll", render: (u) => (u.employeeUuid ? "Yes" : <span className="text-faint">No</span>) },
      ]}
    />
  );
};
