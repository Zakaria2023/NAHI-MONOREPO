import { listItemOptions, listWarehouseOptions } from "services";
import { Card } from "ui";
import { StocktakeForm } from "./stocktake-form";

export const NewStocktake = async () => {
  const [warehouses, items] = await Promise.all([listWarehouseOptions(), listItemOptions()]);
  return (
    <Card title="Stocktake" description="Enter what is actually on the shelf. The book quantity is frozen beside it when you record the count.">
      <StocktakeForm warehouses={warehouses} items={items} />
    </Card>
  );
};
