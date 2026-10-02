import { listItemOptions, listSupplierContracts, listSuppliers } from "services";
import { Card } from "ui";
import { ContractForm } from "./contract-form";
import { ContractsTable } from "./contracts-table";

export const ContractsBoard = async () => {
  const [contracts, suppliers, items] = await Promise.all([listSupplierContracts(), listSuppliers(), listItemOptions()]);
  return (
    <div className="flex flex-col gap-6">
      <ContractsTable contracts={contracts} />
      <Card title="Sign a contract" description="Procurement — one price per item, with the terms every call-off PO inherits">
        <ContractForm key={contracts.length} suppliers={suppliers.map((s) => ({ value: s.uuid, label: s.name }))} items={items} />
      </Card>
    </div>
  );
};
