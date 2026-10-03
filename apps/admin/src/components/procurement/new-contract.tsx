import { listItemOptions, listSuppliers } from "services";
import { Card } from "ui";
import { ContractForm } from "./contract-form";

/** Loads the pickers, then shows the form. */
export const NewContract = async () => {
  const [suppliers, items] = await Promise.all([listSuppliers(), listItemOptions()]);
  return (
    <Card title="Contract" description="Prices exclude VAT. A request whose items a contract in force prices is ordered without a new RFQ.">
      <ContractForm suppliers={suppliers.map((s) => ({ value: s.uuid, label: s.name }))} items={items} />
    </Card>
  );
};
