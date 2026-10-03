"use client";

import { Check, X } from "lucide-react";
import { StcParty } from "@/db/enum";
import { STC_PARTY_LABELS } from "@/db/label";
import { DecisionNoteForm } from "@/components/shared/decision-note-form";
import { FormDialog } from "@/components/shared/form-dialog";
import { ActionResult } from "@/lib/action-result";

type PartyDecisionProps = {
  party: StcParty;
  action: (prev: ActionResult, data: { decision: "approved" | "rejected"; note?: string }) => Promise<ActionResult>;
};

/** Records one party's decision on one document, as recorded from STC's system — approve or reject, each in its own dialog. */
export const PartyDecision = ({ party, action }: PartyDecisionProps) => (
  <div className="flex flex-wrap items-center gap-1.5">
    <span className="text-xs text-muted">{STC_PARTY_LABELS[party]}:</span>
    <FormDialog label="Approve" title={`${STC_PARTY_LABELS[party]} approves`} description="As recorded in STC's system" variant="success" size="sm" icon={<Check size={12} />}>
      <DecisionNoteForm action={action} decision="approved" submitLabel="Approve" />
    </FormDialog>
    <FormDialog label="Reject" title={`${STC_PARTY_LABELS[party]} rejects`} description="A rejection needs the reason STC gave" size="sm" icon={<X size={12} />}>
      <DecisionNoteForm action={action} decision="rejected" submitLabel="Reject" />
    </FormDialog>
  </div>
);
