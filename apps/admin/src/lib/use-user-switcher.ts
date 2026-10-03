"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { StaffRole } from "@/db/enum";
import { switchUserAction } from "@/app/(dashboard)/actions";

type SwitchableUser = {
  uuid: string;
  name: string;
  role: StaffRole;
};

/**
 * The navbar's user menu: open and close it, pick a user — the cookie changes
 * and the app re-renders as them. The list is the admin and the employees; the
 * other roles, needed only to walk an approval chain, fold away under it.
 */
export const useUserSwitcher = (users: SwitchableUser[]) => {
  const [, dispatch, isPending] = useActionState(switchUserAction, {});
  const [isOpen, setIsOpen] = useState(false);
  const [showOthers, setShowOthers] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  const choose = (uuid: string) => {
    setIsOpen(false);
    startTransition(() => dispatch(uuid));
  };

  return {
    choose,
    isPending,
    isOpen,
    toggle: () => setIsOpen((open) => !open),
    showOthers,
    toggleOthers: () => setShowOthers((show) => !show),
    containerRef,
    admins: users.filter((u) => u.role === "system_admin"),
    employees: users.filter((u) => u.role === "employee"),
    others: users.filter((u) => u.role !== "system_admin" && u.role !== "employee"),
  };
};
