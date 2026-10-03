import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { accessRedirect, hasOwnTasks, listAlerts, listPendingApprovals, listStaff, taskCountsFor } from "services";
import { Shell } from "@/components/layout/shell";
import { buildNav } from "@/lib/nav";
import { PATHNAME_HEADER } from "@/lib/pathname-header";
import { getCurrentStaff } from "@/lib/server/auth";

type Props = {
  children: ReactNode;
};

const DashboardLayout = async ({ children }: Props) => {
  const current = await getCurrentStaff();
  // Each kind of user has their own pages: an employee is sent home from the admin's, the admin from "My tasks".
  const elsewhere = accessRedirect(current.role, (await headers()).get(PATHNAME_HEADER) ?? "/");
  if (elsewhere) {
    redirect(elsewhere);
  }
  const [users, pending, alerts, tasks] = await Promise.all([
    listStaff(),
    listPendingApprovals(current.role),
    listAlerts(),
    taskCountsFor(current),
  ]);
  return (
    <Shell
      groups={buildNav({
        approvals: pending.length,
        alerts: alerts.length,
        myTasks: tasks.unseen + tasks.toReview,
        toReview: tasks.toReview,
        role: current.role,
        ownTasks: hasOwnTasks(current.role),
      })}
      current={current}
      users={users.map((u) => ({ uuid: u.uuid, name: u.name, role: u.role }))}
      urgentAlerts={alerts.filter((a) => a.severity === "danger").length}
    >
      {children}
    </Shell>
  );
};

export default DashboardLayout;
