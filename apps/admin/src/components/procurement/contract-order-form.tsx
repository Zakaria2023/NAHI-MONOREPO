"use client";

import { FileSignature } from "lucide-react";
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

/** A contract in force prices every item: the request can be ordered straight away, without quotations. */
export const ContractOrderForm = ({ action, contracts }: ContractOrderFormProps) => {
  const { form, state, isPending, onSubmit } = useContractOrderForm(action, contracts[0]?.uuid ?? "");
  return (
    <div className="flex flex-col gap-4 rounded-control border border-primary-tint-border bg-primary-tint/40 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-primary-tint text-primary">
          <FileSignature size={17} />
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-ink">An annual contract covers this request</span>
          <span className="text-sm text-muted">
            Order at the contract&apos;s prices and terms instead of collecting quotations. The PO goes to the PO approval chain.
          </span>
        </div>
      </div>
      <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Order under contract" layout="inline">
        <div className="w-96 max-w-full">
          <DropdownField
            name="contractUuid"
            label="Contract"
            options={contracts.map((c) => ({
              value: c.uuid,
              label: `${c.number} — ${c.supplierName}`,
              hint: `${c.title} · ${formatMoney(c.subtotal)} excl. VAT`,
            }))}
          />
        </div>
      </ActionForm>
    </div>
  );
};
