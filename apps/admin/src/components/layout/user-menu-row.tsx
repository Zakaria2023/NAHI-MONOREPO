import { Check } from "lucide-react";
import { initialsOf } from "utils";
import { STAFF_ROLE_LABELS } from "@/db/label";
import { StaffRole } from "@/db/enum";

type UserMenuRowProps = {
  user: { uuid: string; name: string; role: StaffRole };
  current: boolean;
  onChoose: (uuid: string) => void;
};

/** One user in the navbar's switch-user menu. */
export const UserMenuRow = ({ user, current, onChoose }: UserMenuRowProps) => (
  <button
    type="button"
    role="menuitem"
    disabled={current}
    onClick={() => onChoose(user.uuid)}
    className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-start transition-colors ${current ? "bg-primary-tint" : "hover:bg-hover"}`}
  >
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
        user.role === "employee" ? "bg-teal-tint text-teal" : "bg-primary-tint text-primary"
      }`}
    >
      {initialsOf(user.name)}
    </span>
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="line-clamp-1 text-sm text-ink">{user.name}</span>
      <span className="line-clamp-1 text-xs text-muted">{STAFF_ROLE_LABELS[user.role]}</span>
    </span>
    {current && <Check size={15} className="shrink-0 text-primary" />}
  </button>
);
