"use client";

import { usePaymentForm } from "@/app/(dashboard)/finance/payables/[uuid]/use-payment-form";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { TextField } from "@/components/forms/text-field";
import { paymentMethods } from "@/db/enum";
import { PAYMENT_METHOD_LABELS } from "@/db/label";
import { FormAction } from "@/lib/action-result";

type PaymentFormProps = {
  action: FormAction;
  outstanding: number;
};

export const PaymentForm = ({ action, outstanding }: PaymentFormProps) => {
  const { form, state, isPending, onSubmit } = usePaymentForm(action, outstanding);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Record payment" columns={2} submitVariant="success">
      <DropdownField name="method" label="Method" required options={paymentMethods.map((m) => ({ value: m, label: PAYMENT_METHOD_LABELS[m] }))} />
      <TextField name="reference" label="Transfer / cheque reference" required />
      <TextField name="amount" label="Amount (SAR)" type="number" required />
      <TextField name="paidAt" label="Paid on" type="date" required />
    </ActionForm>
  );
};
