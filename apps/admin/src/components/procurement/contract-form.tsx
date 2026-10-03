"use client";

import { DropdownOption } from "ui";
import { useContractForm } from "@/app/(dashboard)/procurement/contracts/new/use-contract-form";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { LinesField } from "@/components/forms/lines-field";
import { TextField } from "@/components/forms/text-field";

type ContractFormProps = {
  suppliers: DropdownOption[];
  items: DropdownOption[];
};

export const ContractForm = ({ suppliers, items }: ContractFormProps) => {
  const { form, state, isPending, onSubmit } = useContractForm();
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Sign contract" columns={3}>
      <DropdownField name="supplierUuid" label="Supplier" options={suppliers} placeholder="Pick a supplier" required />
      <TextField name="title" label="Title" placeholder="Fiber cable — 2026" required />
      <TextField name="deliveryDays" label="Delivery (days)" type="number" />
      <TextField name="startsAt" label="In force from" type="date" required />
      <TextField name="endsAt" label="Until" type="date" required />
      <TextField name="paymentTermsDays" label="Payment terms (days)" type="number" />
      <TextField name="latePenaltyPctPerDay" label="Late penalty (% a day)" type="number" />
      <TextField name="latePenaltyCapPct" label="Penalty cap (% of invoice)" type="number" />
      <div />
      <LinesField
        name="lines"
        label="Agreed prices"
        emptyRow={{ itemUuid: "", unitPrice: "" }}
        columns={[
          { name: "itemUuid", label: "Item", type: "select", options: items, span: 6 },
          { name: "unitPrice", label: "Unit price (SAR, excl. VAT)", type: "number", span: 3 },
        ]}
      />
    </ActionForm>
  );
};
