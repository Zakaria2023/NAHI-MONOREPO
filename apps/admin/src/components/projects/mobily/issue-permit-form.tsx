"use client";

import { useIssuePermitForm } from "@/app/(dashboard)/projects/[uuid]/use-project-forms";
import { ActionForm } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/text-field";
import { FormAction } from "@/lib/action-result";

type IssuePermitFormProps = {
  action: FormAction;
  permitUuid: string;
};

export const IssuePermitForm = ({ action, permitUuid }: IssuePermitFormProps) => {
  const { form, state, isPending, onSubmit } = useIssuePermitForm(action, permitUuid);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Mark issued" layout="inline" submitVariant="outline">
      <div className="w-40">
        <TextField name="issuedAt" label="Issued on" type="date" />
      </div>
    </ActionForm>
  );
};
