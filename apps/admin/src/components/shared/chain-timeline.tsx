import { CheckCircle2, Circle, Clock, XCircle } from "lucide-react";
import { Approval } from "services";
import { STAFF_ROLE_LABELS } from "@/db/label";
import { StaffRole } from "@/db/enum";
import { formatDateTime } from "utils";

type ChainTimelineProps = {
  chain: StaffRole[];
  approvals: Approval[];
};

/** Each role in the chain, in order, with who decided and when. */
export const ChainTimeline = ({ chain, approvals }: ChainTimelineProps) => (
  <ol className="flex flex-col gap-3">
    {chain.map((role, index) => {
      const decision = approvals[index];
      const isNext = !decision && approvals.length === index && !approvals.some((a) => a.decision === "rejected");
      return (
        <li key={`${role}-${index}`} className="flex items-start gap-3">
          <span className="mt-0.5">
            {decision?.decision === "approved" && <CheckCircle2 size={18} className="text-success" />}
            {decision?.decision === "rejected" && <XCircle size={18} className="text-danger" />}
            {!decision && isNext && <Clock size={18} className="text-warning" />}
            {!decision && !isNext && <Circle size={18} className="text-faint" />}
          </span>
          <div className="flex flex-col">
            <span className="text-sm text-ink">{STAFF_ROLE_LABELS[role]}</span>
            {decision ? (
              <span className="text-xs text-muted">
                {decision.decision === "approved" ? "Approved" : "Rejected"} by {decision.actorName} · {formatDateTime(decision.at)}
                {decision.note && ` — ${decision.note}`}
              </span>
            ) : (
              <span className="text-xs text-muted">{isNext ? "Waiting" : "Not yet"}</span>
            )}
          </div>
        </li>
      );
    })}
  </ol>
);
