"use client";

import { useSeenMarker } from "@/app/(dashboard)/tasks/[uuid]/use-seen-marker";
import { ButtonAction } from "@/lib/action-result";

type SeenMarkerProps = {
  action: ButtonAction;
};

/** Renders nothing: records the assignee's first look at the task. */
export const SeenMarker = ({ action }: SeenMarkerProps) => {
  useSeenMarker(action);
  return null;
};
