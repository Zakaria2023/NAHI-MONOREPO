"use client";

import { Dropdown } from "ui";
import { initialsOf } from "utils";
import { STAFF_ROLE_LABELS } from "@/db/label";
import { StaffRole } from "@/db/enum";
import { useUserSwitcher } from "@/lib/use-user-switcher";

type UserSwitcherProps = {
  current: { uuid: string; name: string; role: StaffRole };
  users: { uuid: string; name: string; role: StaffRole }[];
};

/** Who the app acts as — the MVP's stand-in for signing in. */
export const UserSwitcher = ({ current, users }: UserSwitcherProps) => {
  const { choose, isPending } = useUserSwitcher();
  return (
    <div className={`flex items-center gap-3 ${isPending ? "opacity-60" : ""}`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-white">
        {initialsOf(current.name)}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-ink">{current.name}</span>
        <span className="text-xs text-muted">{STAFF_ROLE_LABELS[current.role]}</span>
      </div>
      <div className="w-56">
        <Dropdown
          triggerLabel="Switch user"
          options={users.map((u) => ({ value: u.uuid, label: u.name, hint: STAFF_ROLE_LABELS[u.role] }))}
          value={current.uuid}
          onChange={choose}
        />
      </div>
    </div>
  );
};
