"use client";

import { useEvaluationForm } from "@/app/(dashboard)/procurement/orders/[uuid]/use-order-forms";
import { ActionForm } from "@/components/forms/action-form";
import { TextareaField } from "@/components/forms/textarea-field";
import { FormAction } from "@/lib/action-result";
import { ScoreField } from "./score-field";

type SupplierEvaluationFormProps = {
  action: FormAction;
};

export const SupplierEvaluationForm = ({ action }: SupplierEvaluationFormProps) => {
  const { form, state, isPending, onSubmit } = useEvaluationForm(action);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Record evaluation" columns={3}>
      <ScoreField name="quality" label="Quality" />
      <ScoreField name="onTime" label="On time" />
      <ScoreField name="price" label="Price" />
      <div className="md:col-span-full">
        <TextareaField name="note" label="Note" placeholder="What went well, what did not" />
      </div>
    </ActionForm>
  );
};
