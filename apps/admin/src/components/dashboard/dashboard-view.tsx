import { hasOwnTasks } from "services";
import { getCurrentStaff } from "@/lib/server/auth";
import { CompanyDashboard } from "./company-dashboard";
import { EmployeeDashboard } from "./employee-dashboard";

/** One home per kind of user: a plain employee sees their own work, the admin and staff the company. */
export const DashboardView = async () => {
  const actor = await getCurrentStaff();
  return actor.role === "employee" ? <EmployeeDashboard /> : <CompanyDashboard ownTasks={hasOwnTasks(actor.role)} />;
};
