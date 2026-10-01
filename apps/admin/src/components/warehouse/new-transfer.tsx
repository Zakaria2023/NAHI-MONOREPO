import { listItemOptions, listWarehouseOptions } from "services";
import { Card } from "ui";
import { TransferForm } from "./transfer-form";

export const NewTransfer = async () => {
  const [warehouses, items] = await Promise.all([listWarehouseOptions(), listItemOptions()]);
  return (
    <Card title="Transfer" description="The source warehouse must hold the quantities. The balance moves on the last approval.">
      <TransferForm warehouses={warehouses} items={items} />
    </Card>
  );
};
