"use client";

import { Check, X } from "lucide-react";
import { FormProvider } from "react-hook-form";
import { Button, FormError } from "ui";
import { useExtractDecisionForm } from "@/app/(dashboard)/finance/extracts/[uuid]/use-extract-decision-form";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { FormAction } from "@/lib/action-result";

type ExtractDecisionFormProps = {
  action: FormAction;
  /** Who the chain is waiting for, by label. */
  awaitingLabel: string;
  canDecide: boolean;
  penalties: number;
  penaltyNote?: string;
};

export const ExtractDecisionForm = ({ action, awaitingLabel, canDecide, penalties, penaltyNote }: ExtractDecisionFormProps) => {
  const { form, state, isPending, decide } = useExtractDecisionForm(action, penalties, penaltyNote);

  if (!canDecide) {
    return (
      <p className="rounded-control border border-hairline-soft bg-hover px-3 py-2 text-sm text-muted">
        Waiting for <span className="font-medium text-ink">{awaitingLabel}</span>. Switch user at the foot of the sidebar to act as them.
      </p>
    );
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={(event) => event.preventDefault()} className="flex flex-col gap-3" noValidate>
        <p className="text-sm text-muted">
          Your decision as <span className="font-medium text-ink">{awaitingLabel}</span>
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField name="penalties" label="Penalties (SAR)" type="number" />
          <TextField name="penaltyNote" label="Penalty reason" placeholder="Delay or breach" />
        </div>
        <TextareaField name="note" label="Note" placeholder="Required to reject" />
        <div className="flex gap-2">
          <Button variant="success" onClick={() => decide("approved")} disabled={isPending}>
            <Check size={16} />
            Approve
          </Button>
          <Button variant="outline" onClick={() => decide("rejected")} disabled={isPending}>
            <X size={16} />
            Reject
          </Button>
        </div>
        <FormError message={state.error} />
      </form>
    </FormProvider>
  );
};
