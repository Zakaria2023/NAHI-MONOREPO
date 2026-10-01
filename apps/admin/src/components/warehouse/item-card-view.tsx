import { getItemCard } from "services";
import { Card } from "ui";
import { formatMoney, formatNumber } from "utils";
import { ITEM_CATEGORY_LABELS } from "@/db/label";
import { FactList } from "@/components/shared/fact-list";
import { PageHeader } from "@/components/shared/page-header";
import { ItemKindPill } from "./item-kind-pill";
import { ItemMovementsTable } from "./item-movements-table";

type ItemCardViewProps = {
  uuid: string;
};

export const ItemCardView = async ({ uuid }: ItemCardViewProps) => {
  const { item, rows, total } = await getItemCard(uuid);
  return (
    <>
      <PageHeader
        title={`${item.code} — ${item.name}`}
        description="The item card: every receipt, issue, transfer, adjustment and write-off, with the running balance."
        back={{ href: "/warehouse/stock", label: "Stock balance" }}
        meta={<ItemKindPill kind={item.kind} />}
      />
      <Card>
        <FactList
          columns={4}
          facts={[
            { label: "Category", value: ITEM_CATEGORY_LABELS[item.category] },
            { label: "Unit", value: item.unit },
            { label: "Balance (all warehouses)", value: `${formatNumber(total)} ${item.unit}` },
            { label: "Reorder level", value: `${formatNumber(item.reorderLevel)} ${item.unit}` },
            { label: "Standard cost", value: formatMoney(item.standardCost) },
            { label: "Movements", value: rows.length },
          ]}
        />
      </Card>
      <Card title="Movements" description="Newest first. Positive quantities come into a warehouse, negative ones leave it.">
        <ItemMovementsTable rows={rows} unit={item.unit} />
      </Card>
    </>
  );
};
