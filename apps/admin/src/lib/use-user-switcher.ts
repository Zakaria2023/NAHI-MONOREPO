"use client";

import { startTransition, useActionState } from "react";
import { switchUserAction } from "@/app/(dashboard)/actions";

/** The navbar widget's behaviour: pick a user, the cookie changes, the app re-renders as them. */
export const useUserSwitcher = () => {
  const [state, dispatch, isPending] = useActionState(switchUserAction, {});
  const choose = (uuid: string) => {
    startTransition(() => dispatch(uuid));
  };
  return { choose, isPending, error: state.error };
};
