import { FileSignature } from "lucide-react";
import { CoveringContract } from "services";
import { FormDialog } from "@/components/shared/form-dialog";
import { FormAction } from "@/lib/action-result";
import { ContractOrderForm } from "./contract-order-form";

type ContractOrderCardProps = {
  action: FormAction;
  contracts: CoveringContract[];
};

/** A contract in force prices every item: the request can be ordered straight away, without quotations. */
export const ContractOrderCard = ({ action, contracts }: ContractOrderCardProps) => (
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
    <FormDialog
      label="Order under contract"
      title="Order under contract"
      description="The PO is raised at the contract's prices and terms"
      variant="primary"
    >
      <ContractOrderForm action={action} contracts={contracts} />
    </FormDialog>
  </div>
);
