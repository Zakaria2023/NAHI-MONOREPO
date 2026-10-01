"use client";

import { DropdownOption } from "ui";
import { useIssueRequestForm } from "@/app/(dashboard)/warehouse/issue-requests/new/use-issue-request-form";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { LinesField } from "@/components/forms/lines-field";
import { TextField } from "@/components/forms/text-field";
import { inventoryFrequencies, recipientKinds } from "@/db/enum";
import { INVENTORY_FREQUENCY_LABELS, RECIPIENT_KIND_LABELS } from "@/db/label";

type IssueRequestFormProps = {
  projects: DropdownOption[];
  warehouses: DropdownOption[];
  items: DropdownOption[];
  subcontractors: DropdownOption[];
};

export const IssueRequestForm = ({ projects, warehouses, items, subcontractors }: IssueRequestFormProps) => {
  const { form, state, isPending, onSubmit, recipientKind } = useIssueRequestForm();
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Submit to the region PM" columns={2}>
      <DropdownField name="projectUuid" label="Project" required options={projects} placeholder="Charged to this project" />
      <DropdownField name="warehouseUuid" label="Warehouse" required options={warehouses} />
      <DropdownField
        name="recipientKind"
        label="Recipient"
        required
        options={recipientKinds.map((k) => ({
          value: k,
          label: RECIPIENT_KIND_LABELS[k],
          hint: k === "employee" ? "Fixed assets become custody on the employee" : undefined,
        }))}
      />
      <TextField
        name="recipientName"
        label={recipientKind === "cost_center" ? "Cost center" : "Recipient name"}
        required
        placeholder={recipientKind === "subcontractor" ? "Who receives it for the subcontractor" : undefined}
      />
      {recipientKind === "subcontractor" && (
        <DropdownField name="subcontractorUuid" label="Subcontractor" required options={subcontractors} />
      )}
      <DropdownField
        name="inventoryFrequency"
        label="Custody count frequency"
        placeholder="Needed when a fixed asset is issued"
        options={inventoryFrequencies.map((f) => ({ value: f, label: INVENTORY_FREQUENCY_LABELS[f] }))}
      />
      <LinesField
        name="lines"
        label="Items"
        emptyRow={{ itemUuid: "", qty: 1 }}
        columns={[
          { name: "itemUuid", label: "Item", type: "select", options: items, span: 6 },
          { name: "qty", label: "Quantity", type: "number", span: 5 },
        ]}
      />
    </ActionForm>
  );
};
