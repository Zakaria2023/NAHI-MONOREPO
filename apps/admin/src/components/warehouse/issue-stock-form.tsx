"use client";

import { useIssueStockForm } from "@/app/(dashboard)/warehouse/issue-requests/[uuid]/use-issue-stock-form";
import { ActionForm } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/text-field";
import { FormAction } from "@/lib/action-result";

type IssueStockFormProps = {
  action: FormAction;
  recipientName: string;
};

export const IssueStockForm = ({ action, recipientName }: IssueStockFormProps) => {
  const { form, state, isPending, onSubmit } = useIssueStockForm(action, recipientName);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Issue stock" layout="inline" submitVariant="success">
      <div className="w-72">
        <TextField name="signedByRecipient" label="Signed by the recipient" required />
      </div>
    </ActionForm>
  );
};
