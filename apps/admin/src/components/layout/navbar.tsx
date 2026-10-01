import { Bell, CalendarDays } from "lucide-react";
import Link from "next/link";
import { StaffRole } from "@/db/enum";
import { formatDate, nowIso } from "utils";
import { UserSwitcher } from "./user-switcher";

type NavbarProps = {
  current: { uuid: string; name: string; role: StaffRole };
  users: { uuid: string; name: string; role: StaffRole }[];
  urgentAlerts: number;
};

export const Navbar = ({ current, users, urgentAlerts }: NavbarProps) => (
  <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-hairline bg-surface px-6 2xl:px-10">
    <div className="flex items-center gap-2 text-sm text-muted">
      <CalendarDays size={16} className="text-faint" />
      {formatDate(nowIso())}
    </div>
    <div className="flex items-center gap-3">
      <Link
        href="/alerts"
        aria-label={`${urgentAlerts} urgent alerts`}
        className="relative flex h-10 w-10 items-center justify-center rounded-control border border-hairline text-secondary transition-colors hover:bg-hover hover:text-ink"
      >
        <Bell size={18} />
        {urgentAlerts > 0 && (
          <span className="absolute -top-1 -inset-e-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-xs font-medium text-white ring-2 ring-surface">
            {urgentAlerts}
          </span>
        )}
      </Link>
      <span className="h-8 w-px bg-hairline" />
      <UserSwitcher current={current} users={users} />
    </div>
  </header>
);
