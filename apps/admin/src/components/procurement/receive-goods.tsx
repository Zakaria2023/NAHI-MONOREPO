import { CircleAlert } from "lucide-react";
import { getPurchaseOrder, listWarehouses } from "services";
import { Card } from "ui";
import { formatDate } from "utils";
import { receiveGoodsAction } from "@/app/(dashboard)/procurement/orders/[uuid]/receive/actions";
import { PageHeader } from "@/components/shared/page-header";
import { BlockedNote } from "@/components/warehouse/blocked-note";
import { GoodsReceiptForm } from "./goods-receipt-form";

type ReceiveGoodsProps = {
  uuid: string;
};

/** Receiving (§2): the storekeeper counts what arrived and checks it against the PO. */
export const ReceiveGoods = async ({ uuid }: ReceiveGoodsProps) => {
  const [detail, warehouses] = await Promise.all([getPurchaseOrder(uuid), listWarehouses()]);
  const { po, supplier } = detail;
  const open = po.status === "sent" || po.status === "partially_received";
  const outstanding = detail.receiptState.filter((s) => s.outstanding > 0);
  return (
    <>
      <PageHeader
        title={`Receive goods — ${po.number}`}
        description={`From ${supplier.name}. Accepted quantities go into stock at the PO price; rejected ones go back with the reason.`}
        back={{ href: `/procurement/orders/${po.uuid}`, label: po.number }}
      />
      {open ? (
        <Card title="Goods receipt" description="Count, check and accept or reject each line">
          <div className="flex flex-col gap-4">
            {detail.late && po.expectedDeliveryAt && (
              <p className="flex items-start gap-2 rounded-control border border-danger-tint bg-danger-tint px-3 py-2 text-sm text-danger">
                <CircleAlert size={16} className="mt-0.5 shrink-0" />
                <span>Late — delivery was expected on {formatDate(po.expectedDeliveryAt)}.</span>
              </p>
            )}
            <GoodsReceiptForm
              action={receiveGoodsAction.bind(null, po.uuid)}
              warehouseOptions={warehouses.map((w) => ({ value: w.uuid, label: `${w.code} — ${w.name}`, hint: w.city }))}
              itemOptions={detail.receiptState.map((s) => ({ value: s.itemUuid, label: `${s.item.code} — ${s.item.name}`, hint: `Unit: ${s.item.unit}` }))}
              lines={outstanding.map((s) => ({ itemUuid: s.itemUuid, receivedQty: s.outstanding, acceptedQty: s.outstanding, rejectionReason: "" }))}
            />
          </div>
        </Card>
      ) : (
        <BlockedNote reason="Goods are received once the PO has been sent to the supplier, until all of it is in." />
      )}
    </>
  );
};
