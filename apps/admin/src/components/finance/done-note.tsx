import { CheckCircle2 } from "lucide-react";
import { formatDateTime } from "utils";

type DoneNoteProps = {
  label: string;
  by?: string;
  at?: string;
};

/** A step already taken — what, who and when. */
export const DoneNote = ({ label, by, at }: DoneNoteProps) => (
  <div className="flex items-start gap-2">
    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" />
    <div className="flex flex-col">
      <span className="text-sm text-ink">{label}</span>
      {(by || at) && (
        <span className="text-xs text-muted">
          {by}
          {by && at && " · "}
          {at && formatDateTime(at)}
        </span>
      )}
    </div>
  </div>
);
