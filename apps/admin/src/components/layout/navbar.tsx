import { Bell, CalendarDays } from "lucide-react";
import Link from "next/link";
import { formatDate, nowIso } from "utils";
import { StaffRole } from "@/db/enum";
import { Breadcrumb } from "./breadcrumb";
import { UserMenu } from "./user-menu";

type NavbarProps = {
  crumbs: { group: string; label: string; href: string }[];
  /** The bell's count. An employee, who has no alerts page, gets no bell. */
  urgentAlerts: number;
  current: { uuid: string; name: string; role: StaffRole };
  users: { uuid: string; name: string; role: StaffRole }[];
};

export const Navbar = ({
  crumbs,
  urgentAlerts,
  current,
  users,
}: NavbarProps) => (
  <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-hairline px-10 print:hidden">
    <Breadcrumb crumbs={crumbs} />
    <div className="flex items-center gap-2">
      <span className="hidden items-center gap-2 px-2 text-sm text-muted lg:flex">
        <CalendarDays size={15} className="text-faint" />
        {formatDate(nowIso())}
      </span>
      {current.role !== "employee" && (
        <Link
          href="/alerts"
          aria-label={`${urgentAlerts} urgent alerts`}
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-secondary transition-colors hover:bg-hover hover:text-ink"
        >
          <Bell size={18} />
          {urgentAlerts > 0 && (
            <span className="absolute top-0.5 inset-e-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-xs font-medium text-white ring-2 ring-surface">
              {urgentAlerts}
            </span>
          )}
        </Link>
      )}
      <UserMenu current={current} users={users} />
    </div>
  </header>
);
