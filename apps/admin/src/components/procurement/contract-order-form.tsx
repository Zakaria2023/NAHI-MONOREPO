"use client";

import { CoveringContract } from "services";
import { formatMoney } from "utils";
import { useContractOrderForm } from "@/app/(dashboard)/procurement/requests/[uuid]/use-request-forms";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { FormAction } from "@/lib/action-result";

type ContractOrderFormProps = {
  action: FormAction;
  contracts: CoveringContract[];
};

/** Pick the contract to order under; the PO goes to the PO approval chain. */
export const ContractOrderForm = ({ action, contracts }: ContractOrderFormProps) => {
  const { form, state, isPending, onSubmit } = useContractOrderForm(action, contracts[0]?.uuid ?? "");
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Order under contract">
      <DropdownField
        name="contractUuid"
        label="Contract"
        options={contracts.map((c) => ({
          value: c.uuid,
          label: `${c.number} — ${c.supplierName}`,
          hint: `${c.title} · ${formatMoney(c.subtotal)} excl. VAT`,
        }))}
      />
    </ActionForm>
  );
};
