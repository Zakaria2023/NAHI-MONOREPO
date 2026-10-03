"use client";

import { ChevronDown } from "lucide-react";
import { initialsOf } from "utils";
import { STAFF_ROLE_LABELS } from "@/db/label";
import { StaffRole } from "@/db/enum";
import { useUserSwitcher } from "@/lib/use-user-switcher";
import { UserMenuRow } from "./user-menu-row";

type SwitchableUser = {
  uuid: string;
  name: string;
  role: StaffRole;
};

type UserMenuProps = {
  current: SwitchableUser;
  users: SwitchableUser[];
};

/** Who the app acts as — the MVP's stand-in for signing in. Pick the admin or an employee to see the app as them. */
export const UserMenu = ({ current, users }: UserMenuProps) => {
  const { choose, isPending, isOpen, toggle, showOthers, toggleOthers, containerRef, admins, employees, others } = useUserSwitcher(users);
  return (
    <div ref={containerRef} className={`relative ${isPending ? "opacity-60" : ""}`}>
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex h-10 items-center gap-2.5 rounded-full border border-hairline py-1 ps-1 pe-3 transition-colors hover:border-search-border hover:bg-hover"
      >
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white ${current.role === "employee" ? "bg-teal" : "bg-primary"}`}
        >
          {initialsOf(current.name)}
        </span>
        <span className="hidden flex-col text-start sm:flex">
          <span className="text-sm leading-tight font-medium text-ink">{current.name}</span>
          <span className="text-xs leading-tight text-muted">{STAFF_ROLE_LABELS[current.role]}</span>
        </span>
        <ChevronDown size={15} className={`text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div role="menu" className="absolute top-full z-50 mt-2 flex w-72 flex-col gap-1 rounded-card border border-hairline bg-overlay p-2 shadow-lg inset-e-0">
          <span className="px-2 pt-1 text-xs text-faint">Switch user</span>
          {[
            { title: "Admin", rows: admins },
            { title: "Employees", rows: employees },
          ].map((group) => (
            <div key={group.title} className="flex flex-col">
              <span className="px-2 pt-2 pb-1 text-xs font-medium text-secondary">{group.title}</span>
              {group.rows.map((u) => (
                <UserMenuRow key={u.uuid} user={u} current={u.uuid === current.uuid} onChoose={choose} />
              ))}
            </div>
          ))}
          {others.length > 0 && (
            <div className="mt-1 flex flex-col border-t border-hairline-soft pt-1">
              <button type="button" onClick={toggleOthers} className="flex items-center justify-between rounded-md px-2 py-1.5 text-xs text-muted hover:bg-hover hover:text-ink">
                Other roles — to walk an approval chain
                <ChevronDown size={14} className={`transition-transform ${showOthers ? "rotate-180" : ""}`} />
              </button>
              {showOthers && (
                <div className="scrollbar-slim flex max-h-64 flex-col overflow-y-auto">
                  {others.map((u) => (
                    <UserMenuRow key={u.uuid} user={u} current={u.uuid === current.uuid} onChoose={choose} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
