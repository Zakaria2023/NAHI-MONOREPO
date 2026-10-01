import { Lock } from "lucide-react";

type BlockedNoteProps = {
  reason: string;
};

/** An action the rules do not allow yet, and why. */
export const BlockedNote = ({ reason }: BlockedNoteProps) => (
  <p className="flex items-start gap-2 rounded-control border border-hairline-soft bg-hover px-3 py-2 text-sm text-muted">
    <Lock size={14} className="mt-0.5 shrink-0 text-faint" />
    <span>{reason}</span>
  </p>
);
