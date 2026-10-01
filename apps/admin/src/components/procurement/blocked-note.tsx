import { Lock } from "lucide-react";
import { ReactNode } from "react";

type BlockedNoteProps = {
  children: ReactNode;
};

/** Why an action is not available yet — shown in its place instead of hiding it. */
export const BlockedNote = ({ children }: BlockedNoteProps) => (
  <p className="flex items-start gap-2 rounded-control border border-hairline-soft bg-hover px-3 py-2 text-sm text-muted">
    <Lock size={14} className="mt-0.5 shrink-0 text-faint" />
    <span>{children}</span>
  </p>
);
