"use client";

import { DropdownOption } from "ui";
import { formatMoney } from "utils";
import { EMPTY_EXTRACT_LINE, useExtractForm } from "@/app/(dashboard)/finance/extracts/new/use-extract-form";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { LinesField } from "@/components/forms/lines-field";
import { TextField } from "@/components/forms/text-field";

type ExtractFormProps = {
  subcontractOptions: DropdownOption[];
};

export const ExtractForm = ({ subcontractOptions }: ExtractFormProps) => {
  const { form, state, isPending, onSubmit, gross } = useExtractForm();
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Submit extract" columns={3}>
      <DropdownField name="subcontractUuid" label="Subcontract" required options={subcontractOptions} />
      <TextField name="periodFrom" label="Period from" type="date" required />
      <TextField name="periodTo" label="Period to" type="date" required />
      <LinesField
        name="lines"
        label="Executed quantities"
        emptyRow={EMPTY_EXTRACT_LINE}
        columns={[
          { name: "description", label: "Description", type: "text", span: 5 },
          { name: "unit", label: "Unit", type: "text", span: 2 },
          { name: "qty", label: "Quantity", type: "number", span: 2 },
          { name: "unitRate", label: "Unit rate (SAR)", type: "number", span: 2 },
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-primary-tint-border bg-primary-tint px-4 py-3 md:col-span-full">
        <span className="text-sm text-ink">
          Gross of these quantities: <span className="font-medium tabular-nums">{formatMoney(gross)}</span>
        </span>
        <span className="text-xs text-secondary">Advance, retention and warehouse materials are deducted on review.</span>
      </div>
    </ActionForm>
  );
};
