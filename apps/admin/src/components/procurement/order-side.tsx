import Link from "next/link";
import { PURCHASE_CHAIN, PurchaseOrderDetail } from "services";
import { Card, StatusPill } from "ui";
import { formatDate, formatMoney } from "utils";
import { cancelOrderAction, penaltyTermsAction } from "@/app/(dashboard)/procurement/orders/[uuid]/actions";
import { FactList } from "@/components/shared/fact-list";
import { BlockedNote } from "./blocked-note";
import { CancelOrderForm } from "./cancel-order-form";
import { ChainCard } from "./chain-card";
import { PenaltyTermsForm } from "./penalty-terms-form";

type OrderSideProps = {
  detail: PurchaseOrderDetail;
};

/** The PO's approval chain, its delivery facts, and cancellation while nothing is received. */
export const OrderSide = ({ detail }: OrderSideProps) => {
  const { po, pr, supplier, project } = detail;
  const closed = po.status === "cancelled" || po.status === "rejected";
  return (
    <div className="flex flex-col gap-6">
      <ChainCard
        title="PO approval"
        description="Region PM, procurement, projects manager, CFO, COO, deputy GM"
        chain={PURCHASE_CHAIN}
        approvals={po.approvals}
        state={detail.chain}
      />
      <Card title="Delivery follow-up">
        <FactList
          columns={1}
          facts={[
            { label: "Supplier", value: supplier.name },
            {
              label: "Project",
              value: (
                <Link href={`/projects/${project.uuid}`} className="hover:text-primary">
                  <span dir="ltr">{project.code}</span> · {project.name}
                </Link>
              ),
            },
            {
              label: "Purchase request",
              value: (
                <Link href={`/procurement/requests/${pr.uuid}`} dir="ltr" className="hover:text-primary">
                  {pr.number}
                </Link>
              ),
            },
            { label: "Sent to supplier", value: po.sentAt ? formatDate(po.sentAt) : "Not sent yet" },
            {
              label: "Expected delivery",
              value: po.expectedDeliveryAt ? (
                <span className="flex flex-wrap items-center gap-2">
                  {formatDate(po.expectedDeliveryAt)}
                  {detail.late && <StatusPill tone="danger">Late</StatusPill>}
                </span>
              ) : (
                `${po.deliveryDays} days from sending`
              ),
            },
            { label: "Payment terms", value: `${po.paymentTermsDays} days` },
            {
              label: "Late penalty",
              value:
                (po.latePenaltyPctPerDay ?? 0) > 0
                  ? `${po.latePenaltyPctPerDay} % a day, capped at ${po.latePenaltyCapPct ?? 10} %${detail.contract ? " (contract)" : ""}`
                  : "None",
            },
            { label: "Total incl. VAT", value: formatMoney(po.total) },
          ]}
        />
      </Card>
      {!detail.contract && (po.status === "pending_approval" || po.status === "approved") && (
        <Card title="Late-delivery penalty" description="Procurement, before the PO is sent — deducted from the invoice automatically">
          <PenaltyTermsForm
            action={penaltyTermsAction.bind(null, po.uuid)}
            pctPerDay={po.latePenaltyPctPerDay ?? 0}
            capPct={po.latePenaltyCapPct ?? 10}
          />
        </Card>
      )}
      {!closed && (
        <Card title="Cancel the PO" description="Procurement, with the reason kept in the change log">
          {detail.receipts.length > 0 ? (
            <BlockedNote>Goods were received against this PO — it can no longer be cancelled.</BlockedNote>
          ) : (
            <CancelOrderForm action={cancelOrderAction.bind(null, po.uuid)} />
          )}
        </Card>
      )}
    </div>
  );
};
