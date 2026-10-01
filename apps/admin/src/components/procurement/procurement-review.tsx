import { CheckCircle2, CircleAlert } from "lucide-react";
import { PurchaseRequestDetail } from "services";
import { formatNumber } from "utils";
import { reviewRequestAction } from "@/app/(dashboard)/procurement/requests/[uuid]/actions";
import { ActionButton } from "@/components/shared/action-button";

type ProcurementReviewProps = {
  detail: PurchaseRequestDetail;
};

/** Step 3: procurement confirms what the warehouse and the system hold, and picks the route. */
export const ProcurementReview = ({ detail }: ProcurementReviewProps) => {
  const short = detail.lines.filter((l) => l.inStock < l.qty);
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Check the warehouse and the system balance. If the stock is there, the request goes to the region project manager, the
        projects manager and procurement and is supplied from stock; otherwise quotations are requested from suppliers.
      </p>
      {detail.systemStockCovers ? (
        <div className="flex items-start gap-2 rounded-control border border-success-tint bg-success-tint px-3 py-2 text-sm text-success">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          <span>The system balance in all warehouses covers every line.</span>
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-control border border-warning-tint bg-warning-tint px-3 py-2 text-sm text-warning">
          <CircleAlert size={16} className="mt-0.5 shrink-0" />
          <div className="flex flex-col gap-1">
            <span>The system balance does not cover the request.</span>
            <ul className="flex flex-col gap-0.5 text-xs">
              {short.map((l) => (
                <li key={l.itemUuid}>
                  <span dir="ltr">{l.item.code}</span> — {formatNumber(l.inStock)} of {formatNumber(l.qty)} {l.item.unit} in stock
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-start gap-3">
        <ActionButton
          action={reviewRequestAction.bind(null, detail.pr.uuid, true)}
          label="Supply from stock"
          variant="outline"
          blocker={detail.systemStockCovers ? null : "Stock supply needs the system balance to cover every line — this request must be purchased."}
        />
        <ActionButton action={reviewRequestAction.bind(null, detail.pr.uuid, false)} label="Purchase — request quotations" />
      </div>
    </div>
  );
};
