import { Approval, ChainState } from "services";
import { Card, StatusPill } from "ui";
import { StaffRole } from "@/db/enum";
import { STAFF_ROLE_LABELS } from "@/db/label";
import { ChainTimeline } from "@/components/shared/chain-timeline";
import { DecisionForm } from "@/components/shared/decision-form";
import { FormAction } from "@/lib/action-result";
import { getCurrentStaff } from "@/lib/server/auth";

type ApprovalCardProps = {
  chain: StaffRole[];
  approvals: Approval[];
  state: ChainState;
  /** The decide action, bound to the document. */
  action: FormAction;
  description: string;
  approveLabel?: string;
};

/** The approval chain of a warehouse or custody document, and the decision when it is the actor's turn. */
export const ApprovalCard = async ({ chain, approvals, state, action, description, approveLabel }: ApprovalCardProps) => {
  const actor = await getCurrentStaff();
  return (
    <Card
      title="Approvals"
      description={description}
      action={
        state.rejected ? (
          <StatusPill tone="danger">Rejected</StatusPill>
        ) : state.complete ? (
          <StatusPill tone="success">Fully approved</StatusPill>
        ) : (
          <StatusPill tone="warning">
            {state.approvedCount} of {chain.length}
          </StatusPill>
        )
      }
    >
      <div className="flex flex-col gap-5">
        <ChainTimeline chain={chain} approvals={approvals} />
        {state.nextRole && (
          <DecisionForm
            action={action}
            awaitingLabel={STAFF_ROLE_LABELS[state.nextRole]}
            canDecide={actor.role === state.nextRole}
            approveLabel={approveLabel}
          />
        )}
      </div>
    </Card>
  );
};
