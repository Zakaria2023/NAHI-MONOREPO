import { ReactNode } from "react";
import { DashboardSidebar, NavGroup } from "ui";
import { StaffRole } from "@/db/enum";
import { BRAND_ICON } from "@/lib/nav";
import { Navbar } from "./navbar";
import { UserSwitcher } from "./user-switcher";

type ShellProps = {
  groups: NavGroup[];
  current: { uuid: string; name: string; role: StaffRole };
  users: { uuid: string; name: string; role: StaffRole }[];
  urgentAlerts: number;
  children: ReactNode;
};

/** The sidebar on a grey frame, and the work area as one white panel that uses the whole width beside it. */
export const Shell = ({ groups, current, users, urgentAlerts, children }: ShellProps) => (
  <div className="min-h-screen bg-sidebar">
    <DashboardSidebar
      brand="NAHI"
      tagline="Mobily · STC operations"
      brandIcon={BRAND_ICON}
      groups={groups}
      footer={<UserSwitcher current={current} users={users} />}
    />
    <div className="flex min-h-screen flex-col py-2 pe-2 ps-64">
      <div className="flex flex-1 flex-col rounded-2xl border border-hairline bg-surface">
        <Navbar
          crumbs={groups.flatMap((g) => g.links.map((l) => ({ group: g.title, label: l.label, href: l.href })))}
          urgentAlerts={urgentAlerts}
        />
        <main className="flex w-full flex-1 flex-col gap-8 px-10 pt-8 pb-12">{children}</main>
      </div>
    </div>
  </div>
);
