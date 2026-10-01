import { Bell } from "lucide-react";
import Link from "next/link";
import { STAFF_ROLE_LABELS } from "@/db/label";
import { StaffRole } from "@/db/enum";
import { formatDate, nowIso } from "utils";
import { UserSwitcher } from "./user-switcher";

type NavbarProps = {
  current: { uuid: string; name: string; role: StaffRole };
  users: { uuid: string; name: string; role: StaffRole }[];
  urgentAlerts: number;
};

export const Navbar = ({ current, users, urgentAlerts }: NavbarProps) => (
  <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-hairline bg-surface px-6">
    <div className="flex flex-col">
      <span className="text-sm text-ink">
        Acting as <span className="font-medium">{current.name}</span>
      </span>
      <span className="text-xs text-muted">
        {STAFF_ROLE_LABELS[current.role]} · {formatDate(nowIso())}
      </span>
    </div>
    <div className="flex items-center gap-4">
      <Link
        href="/alerts"
        aria-label={`${urgentAlerts} urgent alerts`}
        className="relative flex h-9 w-9 items-center justify-center rounded-control border border-hairline text-secondary hover:bg-hover"
      >
        <Bell size={17} />
        {urgentAlerts > 0 && (
          <span className="absolute -top-1.5 -end-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-xs text-white">
            {urgentAlerts}
          </span>
        )}
      </Link>
      <UserSwitcher current={current} users={users} />
    </div>
  </header>
);
