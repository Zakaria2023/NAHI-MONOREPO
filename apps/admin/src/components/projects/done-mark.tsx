import { CheckCircle2 } from "lucide-react";
import { formatDate } from "utils";

type DoneMarkProps = {
  at: string;
  by: string;
  note?: string;
};

export const DoneMark = ({ at, by, note }: DoneMarkProps) => (
  <div className="flex items-start gap-2">
    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" />
    <div className="flex flex-col">
      <span className="text-sm text-ink">{formatDate(at)}</span>
      <span className="text-xs text-muted">
        {by}
        {note && ` — ${note}`}
      </span>
    </div>
  </div>
);
