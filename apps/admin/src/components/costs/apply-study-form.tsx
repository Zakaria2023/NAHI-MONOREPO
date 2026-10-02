"use client";

import { useApplyStudyForm } from "@/app/(dashboard)/finance/budgets/[projectUuid]/study/use-study-forms";
import { ActionForm } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/text-field";
import { FormAction } from "@/lib/action-result";

type ApplyStudyFormProps = {
  action: FormAction;
  /** An approved budget changes only with a reason, as a revision. */
  approved: boolean;
  disabled: boolean;
};

export const ApplyStudyForm = ({ action, approved, disabled }: ApplyStudyFormProps) => {
  const { form, state, isPending, onSubmit } = useApplyStudyForm(action);
  return disabled ? (
    <p className="text-sm text-muted">Nothing to apply.</p>
  ) : (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Apply study to budget">
      {approved && <TextField name="reason" label="Reason for the revision" placeholder="Kept with the budget's revisions" />}
      {!approved && <p className="text-sm text-muted">The draft budget&apos;s planned lines become the study&apos;s category totals.</p>}
    </ActionForm>
  );
};
