"use client";

import { Dropdown } from "ui";
import { STAFF_ROLE_LABELS } from "@/db/label";
import { StaffRole } from "@/db/enum";
import { useUserSwitcher } from "@/lib/use-user-switcher";

type UserSwitcherProps = {
  current: { uuid: string; name: string; role: StaffRole };
  users: { uuid: string; name: string; role: StaffRole }[];
};

export const UserSwitcher = ({ current, users }: UserSwitcherProps) => {
  const { choose, isPending } = useUserSwitcher();
  const initials = current.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <div className={`flex items-center gap-3 ${isPending ? "opacity-60" : ""}`}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-tint text-sm font-medium text-primary">
        {initials}
      </div>
      <div className="w-64">
        <Dropdown
          options={users.map((u) => ({ value: u.uuid, label: u.name, hint: STAFF_ROLE_LABELS[u.role] }))}
          value={current.uuid}
          onChange={choose}
        />
      </div>
    </div>
  );
};
