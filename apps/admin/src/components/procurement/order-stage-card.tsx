import { CircleAlert, CircleX, PackageCheck, Star } from "lucide-react";
import { PurchaseOrderDetail } from "services";
import { Card, StatusPill } from "ui";
import { formatDate } from "utils";
import { PurchaseOrderStatus, StaffRole } from "@/db/enum";
import { STAFF_ROLE_LABELS } from "@/db/label";
import { decideOrderAction, evaluateSupplierAction, sendOrderAction } from "@/app/(dashboard)/procurement/orders/[uuid]/actions";
import { ActionButton } from "@/components/shared/action-button";
import { DecisionForm } from "@/components/shared/decision-form";
import { FormDialog } from "@/components/shared/form-dialog";
import { LinkButton } from "@/components/shared/link-button";
import { SupplierEvaluationForm } from "./supplier-evaluation-form";
import { SupplierEvaluationView } from "./supplier-evaluation-view";

type OrderStageCardProps = {
  detail: PurchaseOrderDetail;
  actorRole: StaffRole;
};

const TITLES: Record<PurchaseOrderStatus, { title: string; description: string }> = {
  pending_approval: { title: "PO approval", description: "Step 8 — the same six approvers as the quotation" },
  approved: { title: "Send to the supplier", description: "Step 7 — the PO goes to the supplier by e-mail" },
  sent: { title: "Receive the goods", description: "Receiving (§2) — count, check and accept or reject with the reason" },
  partially_received: { title: "Receive the rest", description: "Receiving (§2) — part of the order is still outstanding" },
  received: { title: "Supplier evaluation", description: "Step 13 — quality, punctuality and price" },
  cancelled: { title: "Cancelled", description: "The PO is closed" },
  rejected: { title: "Rejected", description: "The PO is closed" },
};

/** The one thing the PO needs next, by its status. */
export const OrderStageCard = ({ detail, actorRole }: OrderStageCardProps) => {
  const { po, chain, supplier } = detail;
  const rejection = po.approvals.find((a) => a.decision === "rejected");
  const cancellation = [...po.amendments].reverse().find((a) => a.note.startsWith("Cancelled"));
  const open = po.status !== "cancelled" && po.status !== "rejected" && !(po.status === "received" && po.evaluation);
  return (
    <Card
      title={TITLES[po.status].title}
      description={TITLES[po.status].description}
      action={open ? <StatusPill tone="info">Next step</StatusPill> : undefined}
    >
      {po.status === "pending_approval" && chain.nextRole && (
        <DecisionForm
          action={decideOrderAction.bind(null, po.uuid)}
          awaitingLabel={STAFF_ROLE_LABELS[chain.nextRole]}
          canDecide={actorRole === chain.nextRole}
        />
      )}

      {po.status === "approved" && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            Approved by all six. Procurement e-mails the PO to <span dir="ltr">{supplier.email}</span>; the {po.deliveryDays}-day
            delivery period starts then, and a late delivery raises an alert.
          </p>
          <ActionButton action={sendOrderAction.bind(null, po.uuid)} label="Send to supplier by e-mail" />
        </div>
      )}

      {(po.status === "sent" || po.status === "partially_received") && (
        <div className="flex flex-col gap-4">
          {detail.late && po.expectedDeliveryAt && (
            <p className="flex items-start gap-2 rounded-control border border-danger-tint bg-danger-tint px-3 py-2 text-sm text-danger">
              <CircleAlert size={16} className="mt-0.5 shrink-0" />
              <span>Late — delivery was expected on {formatDate(po.expectedDeliveryAt)}. Follow up with the supplier.</span>
            </p>
          )}
          <p className="text-sm text-muted">
            The storekeeper counts what arrived and checks it against the PO. Accepted quantities are added to stock at the PO price;
            rejected ones go back to the supplier with the reason.
          </p>
          <LinkButton href={`/procurement/orders/${po.uuid}/receive`} label="Receive goods" icon={<PackageCheck size={16} />} />
        </div>
      )}

      {po.status === "received" &&
        (po.evaluation ? (
          <SupplierEvaluationView evaluation={po.evaluation} />
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted">Everything is in. Score {supplier.name} for this order; the scores make up its rating.</p>
            <FormDialog label="Evaluate the supplier" title={`Evaluate ${supplier.name}`} description="Quality, punctuality and price, 1 to 5" variant="primary" icon={<Star size={16} />}>
              <SupplierEvaluationForm action={evaluateSupplierAction.bind(null, po.uuid)} />
            </FormDialog>
          </div>
        ))}

      {po.status === "cancelled" && (
        <p className="flex items-start gap-2 text-sm text-secondary">
          <CircleX size={16} className="mt-0.5 shrink-0 text-muted" />
          <span>{cancellation ? `${cancellation.note} — ${cancellation.by}, ${formatDate(cancellation.at)}.` : "This PO was cancelled."}</span>
        </p>
      )}

      {po.status === "rejected" && (
        <p className="flex items-start gap-2 text-sm text-secondary">
          <CircleX size={16} className="mt-0.5 shrink-0 text-danger" />
          <span>
            {rejection
              ? `Rejected by ${rejection.actorName} (${STAFF_ROLE_LABELS[rejection.role]})${rejection.note ? ` — ${rejection.note}` : ""}.`
              : "This PO was rejected."}
          </span>
        </p>
      )}
    </Card>
  );
};
