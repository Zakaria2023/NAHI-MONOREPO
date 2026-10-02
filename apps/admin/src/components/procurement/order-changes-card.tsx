import { PurchaseOrderDetail } from "services";
import { Card } from "ui";
import { amendOrderAction } from "@/app/(dashboard)/procurement/orders/[uuid]/actions";
import { AmendOrderForm } from "./amend-order-form";

type OrderChangesCardProps = {
  detail: PurchaseOrderDetail;
};

/** Other cases — modifying a PO: procurement changes it, and its approvers sign it again. */
export const OrderChangesCard = ({ detail }: OrderChangesCardProps) => {
  const { po } = detail;
  return (
    <Card
      title="Modify the PO"
      description="Procurement — quantities, prices or delivery. Any increase is checked against the budget, and the PO goes back through its approval chain."
    >
      <AmendOrderForm
        action={amendOrderAction.bind(null, po.uuid)}
        lines={po.lines.map((l) => ({ itemUuid: l.itemUuid, qty: l.qty, unitPrice: l.unitPrice }))}
        deliveryDays={po.deliveryDays}
        items={detail.lines.map((l) => ({ value: l.itemUuid, label: `${l.item.code} — ${l.item.name}` }))}
      />
    </Card>
  );
};
