"use client";

import { DropdownOption } from "ui";
import { useQuotationForm } from "@/app/(dashboard)/procurement/requests/[uuid]/use-request-forms";
import { ActionForm } from "@/components/forms/action-form";
import { CheckboxField } from "@/components/forms/checkbox-field";
import { DropdownField } from "@/components/forms/dropdown-field";
import { LinesField } from "@/components/forms/lines-field";
import { TextField } from "@/components/forms/text-field";
import { FormAction } from "@/lib/action-result";
import { ScoreField } from "./score-field";

type QuotationFormProps = {
  action: FormAction;
  supplierOptions: DropdownOption[];
  itemOptions: DropdownOption[];
  /** The request's items and quantities; the price is filled in from the offer. */
  lines: { itemUuid: string; qty: number; unitPrice: number }[];
};

export const QuotationForm = ({ action, supplierOptions, itemOptions, lines }: QuotationFormProps) => {
  const { form, state, isPending, onSubmit } = useQuotationForm(action, lines);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Record quotation" columns={2} submitVariant="outline">
      <DropdownField name="supplierUuid" label="Supplier" required options={supplierOptions} placeholder="Pick a supplier" />
      <ScoreField name="qualityScore" label="Quality (procurement's view)" />
      <TextField name="deliveryDays" label="Delivery (days)" type="number" required />
      <TextField name="paymentTermsDays" label="Payment terms (days)" type="number" required />
      <div className="md:col-span-full">
        <CheckboxField name="previouslyApproved" label="Previously approved quotation — attached instead of three new offers" />
      </div>
      <LinesField
        name="lines"
        label="Priced lines (quantities may be adjusted)"
        fixed
        emptyRow={{ itemUuid: "", qty: 0, unitPrice: 0 }}
        columns={[
          { name: "itemUuid", label: "Item", type: "select", options: itemOptions, span: 6 },
          { name: "qty", label: "Quantity", type: "number", span: 3 },
          { name: "unitPrice", label: "Unit price excl. VAT (SAR)", type: "number", span: 3 },
        ]}
      />
    </ActionForm>
  );
};
