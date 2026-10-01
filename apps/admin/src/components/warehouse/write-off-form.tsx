"use client";

import { DropdownOption } from "ui";
import { useWriteOffForm } from "@/app/(dashboard)/warehouse/write-offs/new/use-write-off-form";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { LinesField } from "@/components/forms/lines-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { TextField } from "@/components/forms/text-field";
import { writeOffDecisions, writeOffReasons } from "@/db/enum";
import { WRITE_OFF_DECISION_LABELS, WRITE_OFF_REASON_LABELS } from "@/db/label";

type WriteOffFormProps = {
  warehouses: DropdownOption[];
  items: DropdownOption[];
};

export const WriteOffForm = ({ warehouses, items }: WriteOffFormProps) => {
  const { form, state, isPending, onSubmit, decision } = useWriteOffForm();
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Raise write-off" columns={2}>
      <DropdownField name="warehouseUuid" label="Warehouse" required options={warehouses} />
      <DropdownField name="reason" label="Reason" required options={writeOffReasons.map((r) => ({ value: r, label: WRITE_OFF_REASON_LABELS[r] }))} />
      <div className="md:col-span-2">
        <TextareaField name="investigation" label="Investigation summary" placeholder="What happened, who was responsible, what was found" />
      </div>
      <DropdownField
        name="decision"
        label="Decision"
        required
        options={writeOffDecisions.map((d) => ({
          value: d,
          label: WRITE_OFF_DECISION_LABELS[d],
          hint: d === "charge_employee" ? "The value is charged to the employee responsible" : "The company carries the loss",
        }))}
      />
      {decision === "charge_employee" ? <TextField name="chargedEmployee" label="Employee charged" required /> : <div />}
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
