import { listProjectOptions, listWarehouseOptions } from "services";
import { Card } from "ui";
import { AssetForm } from "./asset-form";

export const NewAsset = async () => {
  const [projects, warehouses] = await Promise.all([listProjectOptions(), listWarehouseOptions()]);
  return (
    <Card title="Asset" description="Its cost, salvage value and useful life set the straight-line depreciation; the project chosen takes the monthly charge">
      <AssetForm projects={[{ value: "", label: "Head office (overhead)" }, ...projects]} warehouses={warehouses} />
    </Card>
  );
};
