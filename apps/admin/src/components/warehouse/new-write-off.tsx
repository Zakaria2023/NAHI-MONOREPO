import { listItemOptions, listWarehouseOptions } from "services";
import { Card } from "ui";
import { WriteOffForm } from "./write-off-form";

export const NewWriteOff = async () => {
  const [warehouses, items] = await Promise.all([listWarehouseOptions(), listItemOptions()]);
  return (
    <Card title="Write-off" description="Damage, loss or theft: record the investigation and the decision. Stock leaves the warehouse on the last approval.">
      <WriteOffForm warehouses={warehouses} items={items} />
    </Card>
  );
};
