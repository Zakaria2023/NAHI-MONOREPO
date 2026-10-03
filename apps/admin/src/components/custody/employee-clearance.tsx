import { CircleAlert } from "lucide-react";
import { EmployeeCustodySummary } from "services";
import { StatusPill } from "ui";
import { formatDate } from "utils";
import { BlockedNote } from "@/components/warehouse/blocked-note";
import { FormDialog } from "@/components/shared/form-dialog";
import { ClearanceForm } from "./clearance-form";

type EmployeeClearanceProps = {
  summary: EmployeeCustodySummary;
  /** Why the acting user cannot approve clearances, or null. */
  approverBlocker: string | null;
};

const REASON_LABELS = { resignation: "leaving the company", transfer: "moving branch" };

/** Cleared, blocked by open custody, or ready to clear. */
export const EmployeeClearance = ({ summary, approverBlocker }: EmployeeClearanceProps) => {
  if (summary.clearance) {
    return (
      <div className="flex flex-col items-start gap-1">
        <StatusPill tone="success">Cleared</StatusPill>
        <span className="text-xs text-muted">
          By {summary.clearance.approvedBy} · {formatDate(summary.clearance.approvedAt)} · {REASON_LABELS[summary.clearance.reason]}
        </span>
      </div>
    );
  }
  if (summary.clearanceBlockers.length > 0) {
    return (
      <div className="flex flex-col items-start gap-1.5">
        <StatusPill tone="warning">Blocked</StatusPill>
        <ul className="flex flex-col gap-1">
          {summary.clearanceBlockers.map((b) => (
            <li key={b} className="flex items-start gap-1.5 text-xs text-secondary">
              <CircleAlert size={13} className="mt-0.5 shrink-0 text-warning" />
              {b}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return approverBlocker ? (
    <BlockedNote reason={approverBlocker} />
  ) : (
    <FormDialog label="Approve clearance" title={`Clear ${summary.employeeName}`} description="Everything is settled — the clearance can be issued" size="sm" variant="success">
      <ClearanceForm employeeName={summary.employeeName} />
    </FormDialog>
  );
};
