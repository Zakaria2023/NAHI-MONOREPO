"use client";

import { useLabResultForm } from "@/app/(dashboard)/projects/[uuid]/use-project-forms";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { TextField } from "@/components/forms/text-field";
import { FormAction } from "@/lib/action-result";

type LabResultFormProps = {
  action: FormAction;
  testUuid: string;
};

export const LabResultForm = ({ action, testUuid }: LabResultFormProps) => {
  const { form, state, isPending, onSubmit } = useLabResultForm(action, testUuid);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Save result">
      <DropdownField name="status" label="Result" options={[{ value: "passed", label: "Passed" }, { value: "failed", label: "Failed" }]} />
      <TextField name="testedAt" label="Tested on" type="date" />
    </ActionForm>
  );
};
