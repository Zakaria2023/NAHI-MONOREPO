"use client";

import { useLabTestForm } from "@/app/(dashboard)/projects/[uuid]/use-project-forms";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { labTestSubjects, laboratories } from "@/db/enum";
import { LABORATORY_LABELS, LAB_TEST_SUBJECT_LABELS } from "@/db/label";
import { FormAction } from "@/lib/action-result";

type LabTestFormProps = {
  action: FormAction;
};

export const LabTestForm = ({ action }: LabTestFormProps) => {
  const { form, state, isPending, onSubmit } = useLabTestForm(action);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Add lab test">
      <DropdownField name="lab" label="Laboratory" options={laboratories.map((l) => ({ value: l, label: LABORATORY_LABELS[l] }))} />
      <DropdownField name="subject" label="Tests" options={labTestSubjects.map((s) => ({ value: s, label: LAB_TEST_SUBJECT_LABELS[s] }))} />
    </ActionForm>
  );
};
