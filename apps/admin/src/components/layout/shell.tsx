import { ReactNode } from "react";
import { DashboardSidebar, NavGroup } from "ui";
import { StaffRole } from "@/db/enum";
import { BRAND_ICON } from "@/lib/nav";
import { Navbar } from "./navbar";

type ShellProps = {
  groups: NavGroup[];
  current: { uuid: string; name: string; role: StaffRole };
  users: { uuid: string; name: string; role: StaffRole }[];
  urgentAlerts: number;
  children: ReactNode;
};

/** Sidebar, top bar, and a work area that uses the whole width of the window. */
export const Shell = ({ groups, current, users, urgentAlerts, children }: ShellProps) => (
  <div className="min-h-screen">
    <DashboardSidebar brand="NAHI" tagline="Mobily · STC" brandIcon={BRAND_ICON} groups={groups} />
    <div className="flex min-h-screen flex-col ps-64">
      <Navbar current={current} users={users} urgentAlerts={urgentAlerts} />
      <main className="flex w-full flex-1 flex-col gap-6 px-6 py-6 2xl:px-10">{children}</main>
    </div>
  </div>
);
