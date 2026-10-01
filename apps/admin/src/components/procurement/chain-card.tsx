import { Approval, ChainState } from "services";
import { Card, StatusPill } from "ui";
import { StaffRole } from "@/db/enum";
import { ChainTimeline } from "@/components/shared/chain-timeline";

type ChainCardProps = {
  title: string;
  description: string;
  chain: StaffRole[];
  approvals: Approval[];
  state: ChainState;
};

/** One approval chain of a document, with where it stands. */
export const ChainCard = ({ title, description, chain, approvals, state }: ChainCardProps) => (
  <Card
    title={title}
    description={description}
    action={
      state.rejected ? (
        <StatusPill tone="danger">Rejected</StatusPill>
      ) : state.complete ? (
        <StatusPill tone="success">Approved</StatusPill>
      ) : (
        <StatusPill tone="warning">
          {state.approvedCount} / {chain.length}
        </StatusPill>
      )
    }
  >
    <ChainTimeline chain={chain} approvals={approvals} />
  </Card>
);
