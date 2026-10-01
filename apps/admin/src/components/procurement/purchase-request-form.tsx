"use client";

import { DropdownOption } from "ui";
import { useRequestForm } from "@/app/(dashboard)/procurement/requests/new/use-request-form";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { LinesField } from "@/components/forms/lines-field";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { budgetCategories } from "@/db/enum";
import { BUDGET_CATEGORY_LABELS } from "@/db/label";

type PurchaseRequestFormProps = {
  projectOptions: DropdownOption[];
  itemOptions: DropdownOption[];
};

export const PurchaseRequestForm = ({ projectOptions, itemOptions }: PurchaseRequestFormProps) => {
  const { form, state, isPending, onSubmit, emptyLine } = useRequestForm();
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Raise purchase request" columns={3}>
      <DropdownField name="projectUuid" label="Project" required options={projectOptions} placeholder="Pick a project" />
      <TextField name="department" label="Department" required placeholder="Fiber works — Riyadh" />
      <DropdownField
        name="budgetCategory"
        label="Budget category"
        required
        options={budgetCategories.map((c) => ({ value: c, label: BUDGET_CATEGORY_LABELS[c] }))}
      />
      <LinesField
        name="lines"
        label="Items"
        emptyRow={emptyLine}
        columns={[
          { name: "itemUuid", label: "Item", type: "select", options: itemOptions, span: 5 },
          { name: "qty", label: "Quantity", type: "number", span: 2 },
          { name: "estUnitPrice", label: "Est. unit price (SAR)", type: "number", span: 2 },
          { name: "expectedDate", label: "Needed by", type: "date", span: 2 },
        ]}
      />
      <div className="md:col-span-full">
        <TextareaField name="note" label="Note" placeholder="Why the items are needed, the site or the work order" />
      </div>
    </ActionForm>
  );
};
