"use client";

import { useBankAccountForm } from "@/app/(dashboard)/finance/bank/new/use-bank-account-form";
import { ActionForm } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/text-field";

export const BankAccountForm = () => {
  const { form, state, isPending, onSubmit } = useBankAccountForm();
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Add account" submitVariant="outline" columns={2}>
      <TextField name="code" label="Code" placeholder="SNB-OPS" />
      <TextField name="bank" label="Bank" />
      <div className="md:col-span-2">
        <TextField name="name" label="Account name" />
      </div>
      <div className="md:col-span-2">
        <TextField name="iban" label="IBAN" placeholder="SA00 0000 0000 0000 0000 0000" />
      </div>
      <TextField name="openingBalance" label="Opening balance (SAR)" type="number" />
      <TextField name="openingDate" label="As of" type="date" />
    </ActionForm>
  );
};
