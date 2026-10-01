"use client";

import { Check, X } from "lucide-react";
import { Button, FormError } from "ui";
import { StcParty } from "@/db/enum";
import { STC_PARTY_LABELS } from "@/db/label";
import { ActionResult } from "@/lib/action-result";
import { useDecisionForm } from "@/lib/use-decision-form";

type PartyDecisionProps = {
  party: StcParty;
  action: (prev: ActionResult, data: { decision: "approved" | "rejected"; note?: string }) => Promise<ActionResult>;
};

/** Records one party's decision on one document, as recorded from STC's system. */
export const PartyDecision = ({ party, action }: PartyDecisionProps) => {
  const { note, setNote, decide, isPending, error } = useDecisionForm(action);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted">{STC_PARTY_LABELS[party]}:</span>
        <Button size="sm" variant="success" disabled={isPending} onClick={() => decide("approved")}>
          <Check size={12} />
          Approve
        </Button>
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Reason to reject"
          aria-label={`Reason ${STC_PARTY_LABELS[party]} rejected`}
          className="w-36 rounded-control border border-search-border bg-surface px-2 py-1 text-xs outline-none focus:border-primary"
        />
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => decide("rejected")}>
          <X size={12} />
          Reject
        </Button>
      </div>
      <FormError message={error ?? undefined} />
    </div>
  );
};
