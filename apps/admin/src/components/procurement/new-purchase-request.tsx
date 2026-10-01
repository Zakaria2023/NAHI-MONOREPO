import { listItems, listProjectOptions } from "services";
import { Card } from "ui";
import { ITEM_CATEGORY_LABELS } from "@/db/label";
import { PurchaseRequestForm } from "./purchase-request-form";

/** Loads the pickers, then shows the form. */
export const NewPurchaseRequest = async () => {
  const [projects, items] = await Promise.all([listProjectOptions(), listItems()]);
  return (
    <Card
      title="Request"
      description="The project's budget must be approved. The estimate is checked against the category's remaining budget when the direct manager approves."
    >
      <PurchaseRequestForm
        projectOptions={projects}
        itemOptions={items.map((item) => ({
          value: item.uuid,
          label: `${item.code} — ${item.name}`,
          hint: `Unit: ${item.unit} · ${ITEM_CATEGORY_LABELS[item.category]}`,
        }))}
      />
    </Card>
  );
};
