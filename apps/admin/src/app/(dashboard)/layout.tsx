import { ReactNode } from "react";
import { listAlerts, listPendingApprovals, listStaff } from "services";
import { Shell } from "@/components/layout/shell";
import { buildNav } from "@/lib/nav";
import { getCurrentStaff } from "@/lib/server/auth";

type Props = {
  children: ReactNode;
};

const DashboardLayout = async ({ children }: Props) => {
  const current = await getCurrentStaff();
  const [users, pending, alerts] = await Promise.all([
    listStaff(),
    listPendingApprovals(current.role),
    listAlerts(),
  ]);
  return (
    <Shell
      groups={buildNav({ approvals: pending.length, alerts: alerts.length })}
      current={current}
      users={users.map((u) => ({ uuid: u.uuid, name: u.name, role: u.role }))}
      urgentAlerts={alerts.filter((a) => a.severity === "danger").length}
    >
      {children}
    </Shell>
  );
};

export default DashboardLayout;
