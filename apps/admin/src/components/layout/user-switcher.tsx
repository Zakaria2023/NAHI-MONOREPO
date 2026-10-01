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

/** Who the app acts as — the MVP's stand-in for signing in. Opening the menu switches user. */
export const UserSwitcher = ({ current, users }: UserSwitcherProps) => {
  const { choose, isPending } = useUserSwitcher();
  return (
    <div className={isPending ? "opacity-60" : ""}>
      <Dropdown
        above
        options={users.map((u) => ({ value: u.uuid, label: u.name, hint: STAFF_ROLE_LABELS[u.role] }))}
        value={current.uuid}
        onChange={choose}
        trigger={
          <>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-white">
              {initialsOf(current.name)}
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-medium text-ink">{current.name}</span>
              <span className="text-xs text-muted">{STAFF_ROLE_LABELS[current.role]}</span>
            </span>
          </>
        }
      />
    </div>
  );
};
