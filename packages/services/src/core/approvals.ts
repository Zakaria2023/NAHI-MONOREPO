import { ApprovalDecision, StaffRole } from "../../../../db/enum";
import { STAFF_ROLE_LABELS } from "../../../../db/label";
import { Approval } from "../../../../db/types";
import { Actor } from "./actor";

// ONE APPROVAL ENGINE for every chain in the documents — PRs, quotations, POs,
// transfers, write-offs, cash custody, extracts. A chain is an ordered list of
// roles; each must approve in turn, and one rejection ends it.

export type ChainState = {
  /** The role whose decision is awaited, or null once the chain has ended. */
  nextRole: StaffRole | null;
  complete: boolean;
  rejected: boolean;
  approvedCount: number;
};

export type DecisionInput = {
  actor: Actor;
  decision: ApprovalDecision;
  note?: string;
  at?: string;
};

export const chainState = (
  chain: readonly StaffRole[],
  approvals: readonly Approval[],
): ChainState => {
  const rejected = approvals.some((a) => a.decision === "rejected");
  const approvedCount = approvals.filter((a) => a.decision === "approved").length;
  const complete = !rejected && approvedCount >= chain.length;
  return {
    nextRole: rejected || complete ? null : chain[approvedCount],
    complete,
    rejected,
    approvedCount,
  };
};

/** Why `actor` cannot decide on this chain now, or null if they can. */
export const decisionBlocker = (
  chain: readonly StaffRole[],
  approvals: readonly Approval[],
  actor: Actor,
): string | null => {
  const state = chainState(chain, approvals);
  if (state.rejected) {
    return "This request has already been rejected";
  }
  if (state.complete || state.nextRole === null) {
    return "This request is already fully approved";
  }
  if (actor.role !== state.nextRole) {
    return `Waiting for ${STAFF_ROLE_LABELS[state.nextRole]}`;
  }
  return null;
};

/** The approvals with this decision added. Throws if it is not the actor's turn. */
export const decide = (
  chain: readonly StaffRole[],
  approvals: readonly Approval[],
  { actor, decision, note, at }: DecisionInput,
): Approval[] => {
  const blocker = decisionBlocker(chain, approvals, actor);
  if (blocker) {
    throw new Error(blocker);
  }
  if (decision === "rejected" && !note?.trim()) {
    throw new Error("A rejection needs a reason");
  }
  return [
    ...approvals,
    {
      role: actor.role,
      decision,
      actorName: actor.name,
      at: at ?? new Date().toISOString(),
      note: note?.trim() || undefined,
    },
  ];
};
