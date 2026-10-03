"use client";

import { useCommentForm } from "@/app/(dashboard)/tasks/[uuid]/use-comment-form";
import { ActionForm } from "@/components/forms/action-form";
import { TextareaField } from "@/components/forms/textarea-field";
import { FormAction } from "@/lib/action-result";

type CommentFormProps = {
  action: FormAction;
};

export const CommentForm = ({ action }: CommentFormProps) => {
  const { form, state, isPending, onSubmit } = useCommentForm(action);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Post comment">
      <TextareaField name="text" label="Comment" placeholder="Ask, answer, or note progress" />
    </ActionForm>
  );
};
