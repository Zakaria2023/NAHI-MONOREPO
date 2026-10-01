import { AlertTriangle } from "lucide-react";
import { StcDetail } from "services";
import { StatusPill } from "ui";
import { formatDate } from "utils";
import { MILESTONE_STATUS_LABELS } from "@/db/label";
import { approveMilestoneAction, milestoneFlagsAction, resubmitMilestoneAction } from "@/app/(dashboard)/projects/[uuid]/actions";
import { ActionButton } from "@/components/shared/action-button";
import { FactList } from "@/components/shared/fact-list";
import { MILESTONE_TONES } from "@/lib/status-tones";
import { MilestoneFlagsForm } from "./milestone-flags-form";

type MilestonePanelProps = {
  projectUuid: string;
  detail: StcDetail;
};

/** Rules 5 and 6: closed only by both approvals, rejected by itself without a C09. */
export const MilestonePanel = ({ projectUuid, detail }: MilestonePanelProps) => {
  const milestone = detail.milestone;
  return (
    <div className="flex flex-col gap-4 rounded-control border border-hairline-soft p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink">Milestone in Equait</span>
          <StatusPill tone={MILESTONE_TONES[milestone.status]}>{MILESTONE_STATUS_LABELS[milestone.status]}</StatusPill>
        </div>
        {detail.workflow.m3EndDate && <span className="text-xs text-muted">M3 End Date {formatDate(detail.workflow.m3EndDate)}</span>}
      </div>
      {milestone.status === "rejected" && (
        <div className="flex flex-col items-start gap-2 rounded-control border border-danger-tint bg-danger-tint px-3 py-2">
          <span className="text-sm text-danger">{milestone.rejectionReason}</span>
          <ActionButton action={resubmitMilestoneAction.bind(null, projectUuid)} label="Resubmit Milestone" variant="outline" size="sm" />
        </div>
      )}
      {detail.milestoneWarning && milestone.status === "open" && (
        <div className="flex items-start gap-2 rounded-control border border-warning-tint bg-warning-tint px-3 py-2 text-sm text-warning">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          {detail.milestoneWarning}
        </div>
      )}
      {milestone.status !== "closed" && (
        <MilestoneFlagsForm action={milestoneFlagsAction.bind(null, projectUuid)} qtyIncreased={milestone.qtyIncreased} newUpl={milestone.newUpl} />
      )}
      <FactList
        columns={3}
        facts={[
          { label: "Inspector approval", value: milestone.inspectorApprovedAt ? formatDate(milestone.inspectorApprovedAt) : "Waiting" },
          { label: "Supervisor approval", value: milestone.supervisorApprovedAt ? formatDate(milestone.supervisorApprovedAt) : "Waiting" },
          { label: "Closed", value: milestone.closedAt ? formatDate(milestone.closedAt) : "—" },
        ]}
      />
      {milestone.status === "open" && (
        <div className="flex flex-wrap gap-4">
          <ActionButton action={approveMilestoneAction.bind(null, projectUuid, "inspector")} label="Inspector approves" variant="success" size="sm" blocker={detail.milestoneBlockers.inspector} />
          <ActionButton action={approveMilestoneAction.bind(null, projectUuid, "supervisor")} label="Supervisor approves" variant="success" size="sm" blocker={detail.milestoneBlockers.supervisor} />
        </div>
      )}
    </div>
  );
};
