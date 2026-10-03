"use client";

import { Dropdown } from "ui";
import { initialsOf } from "utils";
import { STAFF_ROLE_LABELS } from "@/db/label";
import { StaffRole } from "@/db/enum";
import { useUserSwitcher } from "@/lib/use-user-switcher";
import { SignOutButton } from "./sign-out-button";

type SwitchableUser = {
  uuid: string;
  name: string;
  role: StaffRole;
};

type UserSwitcherProps = {
  current: SwitchableUser;
  users: SwitchableUser[];
};

/**
 * Who the app acts as. The demo's quick list switches between the admin and the
 * employees in one click; the menu reaches anyone. Sign out goes to /sign-in.
 */
export const UserSwitcher = ({ current, users }: UserSwitcherProps) => {
  const { choose, isPending, quick, everyone } = useUserSwitcher(users);
  return (
    <div className={`flex flex-col gap-3 ${isPending ? "opacity-60" : ""}`}>
      <div className="flex flex-col gap-1.5">
        <span className="px-1 text-xs text-faint">Simulate as</span>
        <ul className="flex flex-col gap-0.5">
          {quick.map((u) => (
            <li key={u.uuid}>
              <button
                type="button"
                onClick={() => choose(u.uuid)}
                disabled={u.uuid === current.uuid || isPending}
                className={`flex w-full items-center gap-2 rounded-control px-2 py-1.5 text-start transition-colors ${
                  u.uuid === current.uuid ? "bg-surface ring-1 ring-hairline" : "hover:bg-sidebar-hover"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                    u.role === "employee" ? "bg-teal-tint text-teal" : "bg-primary-tint text-primary"
                  }`}
                >
                  {initialsOf(u.name)}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="line-clamp-1 text-xs font-medium text-ink">{u.name}</span>
                  <span className="text-xs text-muted">{u.role === "employee" ? "Employee" : "Admin"}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-center gap-1">
        <div className="min-w-0 flex-1">
          <Dropdown
            above
            options={everyone.map((u) => ({ value: u.uuid, label: u.name, hint: STAFF_ROLE_LABELS[u.role] }))}
            value={current.uuid}
            onChange={choose}
            trigger={
              <>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-white">
                  {initialsOf(current.name)}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="line-clamp-1 text-sm font-medium text-ink">{current.name}</span>
                  <span className="line-clamp-1 text-xs text-muted">{STAFF_ROLE_LABELS[current.role]}</span>
                </span>
              </>
            }
          />
        </div>
        <SignOutButton />
      </div>
    </div>
  );
};
