import Link from "next/link";
import { PR_CHAIN, PURCHASE_CHAIN, PurchaseRequestDetail, STOCK_SUPPLY_CHAIN } from "services";
import { Card, StatusPill } from "ui";
import { PURCHASE_ORDER_STATUS_LABELS, STAFF_ROLE_LABELS } from "@/db/label";
import { PO_TONES } from "@/lib/status-tones";
import { ChainCard } from "./chain-card";

type RequestSideProps = {
  detail: PurchaseRequestDetail;
};

/** The chains that apply to this request — the stock route or the purchase route, once procurement has chosen. */
export const RequestSide = ({ detail }: RequestSideProps) => {
  const { pr } = detail;
  const stockRoute = pr.stockAvailable === true;
  const purchaseRoute = pr.stockAvailable === false;
  return (
    <div className="flex flex-col gap-6">
      <ChainCard
        title="Direct manager"
        description="Confirms the need and reserves the budget"
        chain={PR_CHAIN}
        approvals={pr.approvals.slice(0, PR_CHAIN.length)}
        state={detail.prChain}
      />
      {stockRoute && (
        <ChainCard
          title="Stock supply"
          description="Supplied from the warehouse instead of purchased"
          chain={STOCK_SUPPLY_CHAIN}
          approvals={pr.approvals.slice(PR_CHAIN.length)}
          state={detail.stockChain}
        />
      )}
      {purchaseRoute && pr.status !== "rfq" && (
        <ChainCard
          title="Quotation approval"
          description="The same six approve the PO after"
          chain={PURCHASE_CHAIN}
          approvals={pr.quoteApprovals}
          state={detail.quoteChain}
        />
      )}
      {purchaseRoute && pr.status === "rfq" && (
        <Card title="Quotation approval" description="Starts when procurement submits the winning offer">
          <ol className="flex flex-col gap-1.5 text-sm text-secondary">
            {PURCHASE_CHAIN.map((role, index) => (
              <li key={role} className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-hover text-xs text-muted">{index + 1}</span>
                {STAFF_ROLE_LABELS[role]}
              </li>
            ))}
          </ol>
        </Card>
      )}
      {!stockRoute && !purchaseRoute && (
        <Card title="Next chains" description="Decided at procurement review">
          <p className="text-sm text-muted">
            Supplied from stock: region PM, projects manager, procurement. Purchased: quotations approved by six, from the region PM to
            the deputy GM.
          </p>
        </Card>
      )}
      {detail.purchaseOrder && (
        <Card title="Purchase order">
          <div className="relative flex items-center justify-between gap-3">
            <Link
              href={`/procurement/orders/${detail.purchaseOrder.uuid}`}
              dir="ltr"
              className="font-medium text-ink after:absolute after:inset-0 hover:text-primary"
            >
              {detail.purchaseOrder.number}
            </Link>
            <StatusPill tone={PO_TONES[detail.purchaseOrder.status]}>{PURCHASE_ORDER_STATUS_LABELS[detail.purchaseOrder.status]}</StatusPill>
          </div>
        </Card>
      )}
    </div>
  );
};
