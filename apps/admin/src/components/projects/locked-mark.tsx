import { Lock } from "lucide-react";

type LockedMarkProps = {
  reason: string;
};

/** A step the rules do not allow yet, and the rule that says so. */
export const LockedMark = ({ reason }: LockedMarkProps) => (
  <div className="flex items-start gap-2 text-xs text-muted">
    <Lock size={14} className="mt-0.5 shrink-0 text-faint" />
    <span>{reason}</span>
  </div>
);
