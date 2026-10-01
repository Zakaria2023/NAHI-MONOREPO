"use client";

import { Check, X } from "lucide-react";
import { Button, FormError, Textarea } from "ui";
import { ActionResult } from "@/lib/action-result";
import { useDecisionForm } from "@/lib/use-decision-form";

type DecisionFormProps = {
  action: (prev: ActionResult, data: { decision: "approved" | "rejected"; note?: string }) => Promise<ActionResult>;
  /** Who the chain is waiting for, by label. */
  awaitingLabel: string;
  /** Whether the acting user holds that role. */
  canDecide: boolean;
  approveLabel?: string;
};

export const DecisionForm = ({ action, awaitingLabel, canDecide, approveLabel = "Approve" }: DecisionFormProps) => {
  const { note, setNote, decide, isPending, error } = useDecisionForm(action);

  if (!canDecide) {
    return (
      <p className="rounded-control border border-hairline-soft bg-hover px-3 py-2 text-sm text-muted">
        Waiting for <span className="font-medium text-ink">{awaitingLabel}</span>. Switch user in the top bar to act as them.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        Your decision as <span className="font-medium text-ink">{awaitingLabel}</span>
      </p>
      <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Note (required to reject)" />
      <div className="flex gap-2">
        <Button variant="success" onClick={() => decide("approved")} disabled={isPending}>
          <Check size={16} />
          {approveLabel}
        </Button>
        <Button variant="outline" onClick={() => decide("rejected")} disabled={isPending}>
          <X size={16} />
          Reject
        </Button>
      </div>
      <FormError message={error ?? undefined} />
    </div>
  );
};
