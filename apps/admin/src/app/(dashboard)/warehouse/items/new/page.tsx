import { Card } from "ui";
import { PageHeader } from "@/components/shared/page-header";
import { ItemForm } from "@/components/warehouse/item-form";

const NewItemPage = () => (
  <>
    <PageHeader
      title="New item"
      description="A new code in the item master. Fixed assets are issued as custody and counted with the employee."
      back={{ href: "/warehouse/stock", label: "Stock balance" }}
    />
    <Card title="Item" description="The code must be unused; the reorder level raises the below-reorder alert">
      <ItemForm />
    </Card>
  </>
);

export default NewItemPage;
