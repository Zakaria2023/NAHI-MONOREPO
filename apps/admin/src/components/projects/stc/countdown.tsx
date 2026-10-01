"use client";

import { Timer } from "lucide-react";
import { formatDuration } from "utils";
import { useCountdown } from "@/lib/use-countdown";

type CountdownProps = {
  target: string;
};

/** STC §6: the 24 hours between the design End Date and M2, counting down. */
export const Countdown = ({ target }: CountdownProps) => {
  const left = useCountdown(target);
  return left === 0 ? (
    <div className="flex items-center gap-2 rounded-control border border-success-tint bg-success-tint px-3 py-2 text-sm text-success">
      <Timer size={16} />
      The 24 hours have passed — M2 can open.
    </div>
  ) : (
    <div className="flex items-center gap-3 rounded-control border border-warning-tint bg-warning-tint px-3 py-2 text-warning">
      <Timer size={18} />
      <span className="text-2xl tabular-nums">{formatDuration(left)}</span>
      <span className="text-sm">until M2 can open (rule 1)</span>
    </div>
  );
};
