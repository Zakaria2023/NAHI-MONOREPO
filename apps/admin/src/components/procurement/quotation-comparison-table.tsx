import { PurchaseRequestDetail } from "services";
import { StatusPill, Table } from "ui";
import { formatMoney } from "utils";

type QuotationComparisonTableProps = {
  detail: PurchaseRequestDetail;
};

/** Step 5: price, delivery, payment terms and quality side by side, the best of each marked. */
export const QuotationComparisonTable = ({ detail }: QuotationComparisonTableProps) => (
  <Table
    data={detail.comparison}
    rowKey={(c) => c.quotationUuid}
    emptyMessage="No quotation recorded yet. Request offers from at least three suppliers by e-mail and record each one below."
    columns={[
      {
        key: "supplier",
        header: "Supplier",
        render: (c) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{c.supplierName}</span>
            <span dir="ltr" className="w-fit text-xs text-muted">
              {detail.quotations.find((q) => q.uuid === c.quotationUuid)?.number}
            </span>
            <div className="flex flex-wrap gap-1">
              {c.previouslyApproved && <StatusPill tone="info">Previously approved</StatusPill>}
              {detail.pr.selectedQuotationUuid === c.quotationUuid && <StatusPill tone="success">Selected</StatusPill>}
            </div>
          </div>
        ),
      },
      {
        key: "price",
        header: "Total excl. VAT",
        align: "end",
        render: (c) => (
          <div className="flex flex-col items-end gap-1">
            <span className="whitespace-nowrap">{formatMoney(c.total)}</span>
            {c.best.price && <StatusPill tone="success">Best price</StatusPill>}
          </div>
        ),
      },
      {
        key: "delivery",
        header: "Delivery",
        align: "end",
        render: (c) => (
          <div className="flex flex-col items-end gap-1">
            <span className="whitespace-nowrap">{c.deliveryDays} days</span>
            {c.best.delivery && <StatusPill tone="success">Fastest</StatusPill>}
          </div>
        ),
      },
      {
        key: "terms",
        header: "Payment terms",
        align: "end",
        render: (c) => (
          <div className="flex flex-col items-end gap-1">
            <span className="whitespace-nowrap">{c.paymentTermsDays} days</span>
            {c.best.terms && <StatusPill tone="success">Best terms</StatusPill>}
          </div>
        ),
      },
      {
        key: "quality",
        header: "Quality",
        align: "end",
        render: (c) => (
          <div className="flex flex-col items-end gap-1">
            <span className="whitespace-nowrap">{c.qualityScore} / 5</span>
            {c.best.quality && <StatusPill tone="success">Best quality</StatusPill>}
          </div>
        ),
      },
    ]}
  />
);
