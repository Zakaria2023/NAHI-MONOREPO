import { CircleCheck } from "lucide-react";
import { ChainState, PayrollRun } from "services";
import { Card } from "ui";
import { formatDate } from "utils";
import { StaffRole } from "@/db/enum";
import { STAFF_ROLE_LABELS } from "@/db/label";
import { decideRunAction, payRunAction, recalculateRunAction } from "@/app/(dashboard)/payroll/runs/[uuid]/actions";
import { ActionButton } from "@/components/shared/action-button";
import { DecisionForm } from "@/components/shared/decision-form";
import { FormDialog } from "@/components/shared/form-dialog";
import { PayRunForm } from "./pay-run-form";

type PayrollStageCardProps = {
  run: PayrollRun;
  chain: ChainState;
  actorRole: StaffRole;
};

/** What the run needs next: approval (or a recalculation), payment, or nothing. */
export const PayrollStageCard = ({ run, chain, actorRole }: PayrollStageCardProps) => (
  <Card
    title={run.status === "draft" ? "Next step" : run.status === "approved" ? "Payment" : "Paid"}
    description={
      run.status === "draft"
        ? "Recalculate after a timesheet changes; the finance manager approves"
        : run.status === "approved"
          ? "Send the bank transfer file, then record its reference"
          : "The run is closed"
    }
  >
    {run.status === "draft" && chain.nextRole && (
      <div className="flex flex-col gap-4">
        <ActionButton action={recalculateRunAction.bind(null, run.uuid)} label="Recalculate from timesheets" variant="outline" size="sm" />
        <DecisionForm
          action={decideRunAction.bind(null, run.uuid)}
          awaitingLabel={STAFF_ROLE_LABELS[chain.nextRole]}
          canDecide={actorRole === chain.nextRole}
        />
      </div>
    )}
    {run.status === "approved" && (
      <FormDialog label="Mark paid" title={`Pay ${run.number}`} description="The bank's reference for the salary transfer" variant="success">
        <PayRunForm action={payRunAction.bind(null, run.uuid)} />
      </FormDialog>
    )}
    {run.status === "paid" && (
      <p className="flex items-start gap-2 text-sm text-secondary">
        <CircleCheck size={16} className="mt-0.5 shrink-0 text-success" />
        <span>
          Paid {formatDate(run.paidAt)} by {run.paidBy} — bank reference <span dir="ltr">{run.bankReference}</span>.
        </span>
      </p>
    )}
  </Card>
);
