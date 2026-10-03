"use client";

import { usePaymentForm } from "@/app/(dashboard)/finance/payables/[uuid]/pay/use-payment-form";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownOption } from "ui";
import { BankFields } from "@/components/forms/bank-fields";
import { TextField } from "@/components/forms/text-field";
import { FormAction } from "@/lib/action-result";

type PaymentFormProps = {
  action: FormAction;
  outstanding: number;
  accounts: DropdownOption[];
};

export const PaymentForm = ({ action, outstanding, accounts }: PaymentFormProps) => {
  const { form, state, isPending, onSubmit } = usePaymentForm(action, outstanding);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Record payment" columns={2} submitVariant="success">
      <BankFields accounts={accounts} />
      <TextField name="reference" label="Transfer / cheque reference" required />
      <TextField name="amount" label="Amount (SAR)" type="number" required />
      <TextField name="paidAt" label="Paid on" type="date" required />
    </ActionForm>
  );
};
