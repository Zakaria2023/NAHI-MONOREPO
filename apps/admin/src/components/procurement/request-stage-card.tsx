import { ArrowRight, CircleX, PackageCheck } from "lucide-react";
import Link from "next/link";
import { PurchaseRequestDetail, Supplier } from "services";
import { Card, StatusPill } from "ui";
import { formatMoney } from "utils";
import { PurchaseRequestStatus, StaffRole } from "@/db/enum";
import { BUDGET_CATEGORY_LABELS, PURCHASE_ORDER_STATUS_LABELS, STAFF_ROLE_LABELS } from "@/db/label";
import {
  decideQuotationAction,
  decideRequestAction,
  decideStockSupplyAction,
  orderUnderContractAction,
} from "@/app/(dashboard)/procurement/requests/[uuid]/actions";
import { DecisionForm } from "@/components/shared/decision-form";
import { PO_TONES } from "@/lib/status-tones";
import { ContractOrderCard } from "./contract-order-card";
import { ProcurementReview } from "./procurement-review";
import { QuotationsPanel } from "./quotations-panel";

type RequestStageCardProps = {
  detail: PurchaseRequestDetail;
  actorRole: StaffRole;
  suppliers: Supplier[];
};

const TITLES: Record<PurchaseRequestStatus, { title: string; description: string }> = {
  pending_manager: { title: "Direct manager approval", description: "Step 2 — the need is confirmed and the estimate reserved against the budget" },
  in_review: { title: "Procurement review", description: "Step 3 — supply from stock, or purchase" },
  stock_approval: { title: "Stock supply approval", description: "Step 3 — region PM, projects manager and procurement" },
  fulfilled_from_stock: { title: "Supplied from stock", description: "The request is closed" },
  rfq: { title: "Quotations", description: "Steps 4–5 — request, record and compare the offers" },
  quote_approval: { title: "Quotation approval", description: "Step 6 — the six approvers sign off the chosen offer" },
  ordered: { title: "Purchase order", description: "Step 7 — the approved quotation became a PO" },
  rejected: { title: "Rejected", description: "The request is closed" },
};

/** The one thing the request needs next, by its status. */
export const RequestStageCard = ({ detail, actorRole, suppliers }: RequestStageCardProps) => {
  const { pr, prChain, stockChain, quoteChain } = detail;
  const rejection = [...pr.approvals, ...pr.quoteApprovals].find((a) => a.decision === "rejected");
  const selected = detail.comparison.find((c) => c.quotationUuid === pr.selectedQuotationUuid);
  const closed = pr.status === "ordered" || pr.status === "fulfilled_from_stock" || pr.status === "rejected";
  return (
    <Card
      title={TITLES[pr.status].title}
      description={
        detail.purchaseOrder?.contractNumber
          ? `Ordered under annual contract ${detail.purchaseOrder.contractNumber}, at its prices and terms`
          : TITLES[pr.status].description
      }
      action={closed ? undefined : <StatusPill tone="info">Next step</StatusPill>}
    >
      {pr.status === "pending_manager" && prChain.nextRole && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            On approval {formatMoney(detail.estimate)} is reserved against {BUDGET_CATEGORY_LABELS[pr.budgetCategory]}, which has{" "}
            {formatMoney(detail.budgetRemaining)} left. An estimate above that is refused.
          </p>
          <DecisionForm
            action={decideRequestAction.bind(null, pr.uuid)}
            awaitingLabel={STAFF_ROLE_LABELS[prChain.nextRole]}
            canDecide={actorRole === prChain.nextRole}
          />
        </div>
      )}

      {pr.status === "in_review" && <ProcurementReview detail={detail} />}

      {pr.status === "stock_approval" && stockChain.nextRole && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            Procurement found the stock available. On the last approval an approved issue request is raised from the warehouse
            that holds the most, for the storekeeper to issue.
          </p>
          <DecisionForm
            action={decideStockSupplyAction.bind(null, pr.uuid)}
            awaitingLabel={STAFF_ROLE_LABELS[stockChain.nextRole]}
            canDecide={actorRole === stockChain.nextRole}
          />
        </div>
      )}

      {pr.status === "rfq" && (
        <div className="flex flex-col gap-6">
          {detail.contracts.length > 0 && (
            <ContractOrderCard action={orderUnderContractAction.bind(null, pr.uuid)} contracts={detail.contracts} />
          )}
          <QuotationsPanel detail={detail} suppliers={suppliers} />
        </div>
      )}

      {pr.status === "quote_approval" && quoteChain.nextRole && (
        <div className="flex flex-col gap-4">
          {selected && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-hairline-soft px-4 py-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted">Chosen offer</span>
                <span className="text-sm font-medium text-ink">{selected.supplierName}</span>
                <span className="text-xs text-muted">
                  {selected.deliveryDays} days delivery · {selected.paymentTermsDays} days terms · quality {selected.qualityScore} / 5
                </span>
              </div>
              <span className="text-lg text-ink">{formatMoney(selected.total)}</span>
            </div>
          )}
          <p className="text-sm text-muted">A rejection sends the request back to RFQ. The last approval raises the purchase order.</p>
          <DecisionForm
            action={decideQuotationAction.bind(null, pr.uuid)}
            awaitingLabel={STAFF_ROLE_LABELS[quoteChain.nextRole]}
            canDecide={actorRole === quoteChain.nextRole}
          />
        </div>
      )}

      {pr.status === "ordered" && detail.purchaseOrder && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span dir="ltr" className="text-lg text-ink">
              {detail.purchaseOrder.number}
            </span>
            <StatusPill tone={PO_TONES[detail.purchaseOrder.status]}>{PURCHASE_ORDER_STATUS_LABELS[detail.purchaseOrder.status]}</StatusPill>
          </div>
          <Link
            href={`/procurement/orders/${detail.purchaseOrder.uuid}`}
            className="flex items-center gap-1.5 rounded-control bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Open purchase order
            <ArrowRight size={16} className="rtl:-scale-x-100" />
          </Link>
        </div>
      )}

      {pr.status === "fulfilled_from_stock" && (
        <p className="flex items-start gap-2 text-sm text-secondary">
          <PackageCheck size={16} className="mt-0.5 shrink-0 text-success" />
          <span>
            Approved for supply from stock. An approved issue request was raised for the storekeeper — see{" "}
            <Link href="/warehouse/documents" className="text-primary hover:underline">
              Warehouse documents
            </Link>
            .
          </span>
        </p>
      )}

      {pr.status === "rejected" && (
        <p className="flex items-start gap-2 text-sm text-secondary">
          <CircleX size={16} className="mt-0.5 shrink-0 text-danger" />
          <span>
            {rejection
              ? `Rejected by ${rejection.actorName} (${STAFF_ROLE_LABELS[rejection.role]})${rejection.note ? ` — ${rejection.note}` : ""}.`
              : "This request was rejected."}
          </span>
        </p>
      )}
    </Card>
  );
};
