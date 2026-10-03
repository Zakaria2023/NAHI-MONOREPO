"use client";

import { startTransition, useActionState, useEffect } from "react";
import { ButtonAction } from "@/lib/action-result";

/**
 * Records that the assignee opened the task, once, when the page first shows.
 * Only rendered for the assignee of an unseen task; the service ignores any
 * other visit anyway.
 */
export const useSeenMarker = (action: ButtonAction) => {
  const [, dispatch] = useActionState(action, {});
  useEffect(() => {
    startTransition(() => dispatch());
  }, [dispatch]);
};
