"use client";

import { useBounceForm } from "@/app/(dashboard)/finance/cheques/use-bounce-form";
import { ActionForm } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/text-field";
import { FormAction } from "@/lib/action-result";

type BounceFormProps = {
  action: FormAction;
};

export const BounceForm = ({ action }: BounceFormProps) => {
  const { form, state, isPending, onSubmit } = useBounceForm(action);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Bounced" layout="inline" submitVariant="outline">
      <div className="w-44">
        <TextField name="reason" label="Bounce reason" />
      </div>
    </ActionForm>
  );
};
