"use client";

import { LogOut } from "lucide-react";
import { useActionState } from "react";
import { signOutAction } from "@/app/(dashboard)/actions";

export const SignOutButton = () => {
  const [, dispatch, isPending] = useActionState(signOutAction, {});
  return (
    <form action={dispatch}>
      <button
        type="submit"
        disabled={isPending}
        title="Sign out"
        aria-label="Sign out"
        className="flex h-9 w-9 items-center justify-center rounded-control text-muted transition-colors hover:bg-sidebar-hover hover:text-danger disabled:opacity-60"
      >
        <LogOut size={16} className="rtl:-scale-x-100" />
      </button>
    </form>
  );
};
