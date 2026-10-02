"use client";

import { ObligationKind } from "@/db/enum";
import { useFilingForm } from "@/app/(dashboard)/finance/obligations/use-filing-form";
import { ActionForm } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/text-field";

type FilingFormProps = {
  kind: ObligationKind;
  period: string;
};

export const FilingForm = ({ kind, period }: FilingFormProps) => {
  const { form, state, isPending, onSubmit } = useFilingForm(kind, period);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel={kind === "vat" ? "Filed" : "Paid"} layout="inline" submitVariant="outline">
      <div className="w-44">
        <TextField name="reference" label="Reference" placeholder={kind === "vat" ? "ZATCA return no." : "GOSI receipt no."} />
      </div>
    </ActionForm>
  );
};
