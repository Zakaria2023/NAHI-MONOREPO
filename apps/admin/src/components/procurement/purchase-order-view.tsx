import { getPurchaseOrder, listWarehouses } from "services";
import { StatusPill } from "ui";
import { PURCHASE_ORDER_STATUS_LABELS } from "@/db/label";
import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";
import { getCurrentStaff } from "@/lib/server/auth";
import { PO_TONES } from "@/lib/status-tones";
import { AdvanceCard } from "./advance-card";
import { AmendmentsCard } from "./amendments-card";
import { OrderSide } from "./order-side";
import { OrderStageCard } from "./order-stage-card";
import { PurchaseOrderDocument } from "./purchase-order-document";
import { ReceiptProgressCard } from "./receipt-progress-card";
import { ReceiptsCard } from "./receipts-card";
import { RecordLog } from "./record-log";

type PurchaseOrderViewProps = {
  uuid: string;
};

export const PurchaseOrderView = async ({ uuid }: PurchaseOrderViewProps) => {
  const [detail, actor, warehouses] = await Promise.all([getPurchaseOrder(uuid), getCurrentStaff(), listWarehouses()]);
  const { po, supplier, project } = detail;
  const receiving = po.status === "sent" || po.status === "partially_received" || po.status === "received";
  return (
    <>
      <PageHeader
        title={po.number}
        description={`${supplier.name} · ${project.code} — ${project.name}`}
        back={{ href: "/procurement/orders", label: "Purchase orders" }}
        meta={
          <>
            <StatusPill tone={PO_TONES[po.status]}>{PURCHASE_ORDER_STATUS_LABELS[po.status]}</StatusPill>
            {detail.late && <StatusPill tone="danger">Late</StatusPill>}
          </>
        }
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <OrderStageCard detail={detail} actorRole={actor.role} warehouses={warehouses} />
          <PurchaseOrderDocument detail={detail} />
          {receiving && <ReceiptProgressCard detail={detail} />}
          {receiving && <ReceiptsCard detail={detail} warehouses={warehouses} />}
          <AdvanceCard detail={detail} />
          <AmendmentsCard amendments={po.amendments} />
          <AsyncSection reloadKey={`log-${po.uuid}`}>
            <RecordLog number={po.number} uuid={po.uuid} />
          </AsyncSection>
        </div>
        <OrderSide detail={detail} />
      </div>
    </>
  );
};
