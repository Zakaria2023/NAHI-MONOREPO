"use client";

import { Check, X } from "lucide-react";
import { ActionResult } from "@/lib/action-result";
import { DecisionNoteForm } from "./decision-note-form";
import { FormDialog } from "./form-dialog";

type DecisionFormProps = {
  action: (prev: ActionResult, data: { decision: "approved" | "rejected"; note?: string }) => Promise<ActionResult>;
  /** Who the chain is waiting for, by label. */
  awaitingLabel: string;
  /** Whether the acting user holds that role. */
  canDecide: boolean;
  approveLabel?: string;
};

/** Approve or reject, each in its own dialog. */
export const DecisionForm = ({ action, awaitingLabel, canDecide, approveLabel = "Approve" }: DecisionFormProps) =>
  canDecide ? (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        Your decision as <span className="font-medium text-ink">{awaitingLabel}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        <FormDialog label={approveLabel} title={approveLabel} description={`Your approval as ${awaitingLabel}`} variant="success" icon={<Check size={16} />}>
          <DecisionNoteForm action={action} decision="approved" submitLabel={approveLabel} />
        </FormDialog>
        <FormDialog label="Reject" title="Reject" description="A rejection ends the chain and needs a reason" icon={<X size={16} />}>
          <DecisionNoteForm action={action} decision="rejected" submitLabel="Reject" />
        </FormDialog>
      </div>
    </div>
  ) : (
    <p className="rounded-control border border-hairline-soft bg-hover px-3 py-2 text-sm text-muted">
      Waiting for <span className="font-medium text-ink">{awaitingLabel}</span>. Switch user from the navbar to act as them.
    </p>
  );
