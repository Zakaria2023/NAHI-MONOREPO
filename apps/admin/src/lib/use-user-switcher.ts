"use client";

import { startTransition, useActionState } from "react";
import { StaffRole } from "@/db/enum";
import { switchUserAction } from "@/app/(dashboard)/actions";

type SwitchableUser = {
  uuid: string;
  name: string;
  role: StaffRole;
};

/**
 * The sidebar switcher's behaviour: pick a user, the cookie changes, the app
 * re-renders as them. The quick picks are the two sides a demo compares — the
 * system admin and every plain employee.
 */
export const useUserSwitcher = (users: SwitchableUser[]) => {
  const [state, dispatch, isPending] = useActionState(switchUserAction, {});
  const choose = (uuid: string) => {
    startTransition(() => dispatch(uuid));
  };
  const quick = [...users.filter((u) => u.role === "system_admin"), ...users.filter((u) => u.role === "employee")];
  const others = users.filter((u) => u.role !== "system_admin" && u.role !== "employee");
  return { choose, isPending, error: state.error, quick, everyone: [...quick, ...others] };
};
