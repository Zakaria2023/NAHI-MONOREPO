import { Check, X } from "lucide-react";
import { FormDialog } from "@/components/shared/form-dialog";
import { FormAction } from "@/lib/action-result";
import { ExtractDecisionNoteForm } from "./extract-decision-note-form";

type ExtractDecisionFormProps = {
  action: FormAction;
  /** Who the chain is waiting for, by label. */
  awaitingLabel: string;
  canDecide: boolean;
  penalties: number;
  penaltyNote?: string;
};

/** The extract's approve or reject, each in its own dialog. */
export const ExtractDecisionForm = ({ action, awaitingLabel, canDecide, penalties, penaltyNote }: ExtractDecisionFormProps) =>
  canDecide ? (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        Your decision as <span className="font-medium text-ink">{awaitingLabel}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        <FormDialog label="Approve" title="Approve the extract" description={`As ${awaitingLabel} — set any penalties for delay or breach`} variant="success" icon={<Check size={16} />} dialogSize="lg">
          <ExtractDecisionNoteForm action={action} decision="approved" penalties={penalties} penaltyNote={penaltyNote} />
        </FormDialog>
        <FormDialog label="Reject" title="Reject the extract" description="A rejection ends the chain and needs a reason" icon={<X size={16} />}>
          <ExtractDecisionNoteForm action={action} decision="rejected" penalties={penalties} penaltyNote={penaltyNote} />
        </FormDialog>
      </div>
    </div>
  ) : (
    <p className="rounded-control border border-hairline-soft bg-hover px-3 py-2 text-sm text-muted">
      Waiting for <span className="font-medium text-ink">{awaitingLabel}</span>. Switch user from the navbar to act as them.
    </p>
  );
