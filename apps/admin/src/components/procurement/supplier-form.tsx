"use client";

import { useSupplierForm } from "@/app/(dashboard)/procurement/suppliers/use-supplier-form";
import { ActionForm } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/text-field";

export const SupplierForm = () => {
  const { form, state, isPending, onSubmit } = useSupplierForm();
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Register supplier">
      <TextField name="name" label="Trade name" required />
      <TextField name="vatNumber" label="VAT number" required placeholder="3XXXXXXXXXXXXX3" />
      <TextField name="crNumber" label="CR number" required />
      <TextField name="address" label="Address" required />
      <TextField name="email" label="E-mail" type="email" required placeholder="Quotations and POs are sent here" />
      <TextField name="phone" label="Phone" required />
    </ActionForm>
  );
};
