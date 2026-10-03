"use client";

import { DropdownOption } from "ui";
import { useSelectQuotationForm } from "@/app/(dashboard)/procurement/requests/[uuid]/use-request-forms";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { FormAction } from "@/lib/action-result";

type SelectQuotationFormProps = {
  action: FormAction;
  options: DropdownOption[];
  /** The cheapest offer, preselected. */
  defaultUuid: string;
};

export const SelectQuotationForm = ({ action, options, defaultUuid }: SelectQuotationFormProps) => {
  const { form, state, isPending, onSubmit } = useSelectQuotationForm(action, defaultUuid);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Submit for approval">
      <DropdownField name="quotationUuid" label="Winning quotation" options={options} />
    </ActionForm>
  );
};
