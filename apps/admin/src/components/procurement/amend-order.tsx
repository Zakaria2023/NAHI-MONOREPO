import { getPurchaseOrder } from "services";
import { Card } from "ui";
import { amendOrderAction } from "@/app/(dashboard)/procurement/orders/[uuid]/amend/actions";
import { PageHeader } from "@/components/shared/page-header";
import { BlockedNote } from "@/components/warehouse/blocked-note";
import { AmendOrderForm } from "./amend-order-form";

type AmendOrderProps = {
  uuid: string;
};

/** Other cases — modifying a PO: procurement changes it, and its approvers sign it again. */
export const AmendOrder = async ({ uuid }: AmendOrderProps) => {
  const detail = await getPurchaseOrder(uuid);
  const { po } = detail;
  const amendable = ["pending_approval", "approved", "sent", "partially_received"].includes(po.status);
  return (
    <>
      <PageHeader
        title={`Modify ${po.number}`}
        description="Quantities, prices or delivery. Any increase is checked against the budget, and the PO goes back through its approval chain."
        back={{ href: `/procurement/orders/${po.uuid}`, label: po.number }}
      />
      {amendable ? (
        <Card title="The PO as it should be">
          <AmendOrderForm
            action={amendOrderAction.bind(null, po.uuid)}
            lines={po.lines.map((l) => ({ itemUuid: l.itemUuid, qty: l.qty, unitPrice: l.unitPrice }))}
            deliveryDays={po.deliveryDays}
            items={detail.lines.map((l) => ({ value: l.itemUuid, label: `${l.item.code} — ${l.item.name}` }))}
          />
        </Card>
      ) : (
        <BlockedNote reason="A PO that is fully received, cancelled or rejected cannot be modified." />
      )}
    </>
  );
};
