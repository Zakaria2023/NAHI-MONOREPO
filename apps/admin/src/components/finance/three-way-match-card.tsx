import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { GoodsReceipt, PurchaseOrder, ThreeWayMatch } from "services";
import { Card } from "ui";
import { formatDate, formatMoney, formatNumber, sumBy } from "utils";

type ThreeWayMatchCardProps = {
  po: PurchaseOrder;
  receipts: GoodsReceipt[];
  invoiceNet: number;
  match: ThreeWayMatch;
};

/** PO + receipt + invoice (finance §1 step 3): the invoice bills what was accepted, at the PO's prices. */
export const ThreeWayMatchCard = ({ po, receipts, invoiceNet, match }: ThreeWayMatchCardProps) => {
  const figures = [
    { label: "PO total (net)", value: po.subtotal, hint: <Link href={`/procurement/orders/${po.uuid}`} dir="ltr" className="hover:text-primary">{po.number}</Link> },
    { label: "Receipts' accepted value", value: match.expected, hint: `${receipts.length} receipt(s) at PO prices` },
    { label: "Invoice net", value: invoiceNet, hint: "Excluding VAT" },
  ];
  return (
    <Card
      title="Three-way match"
      description="The PO, the goods received and the supplier's invoice must agree before the invoice is approved."
      action={
        match.issues.length === 0 ? (
          <span className="flex items-center gap-1.5 text-sm text-success">
            <CheckCircle2 size={16} />
            Matched
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-sm text-danger">
            <XCircle size={16} />
            {match.issues.length} issue(s)
          </span>
        )
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {figures.map((figure) => (
            <div key={figure.label} className="flex flex-col gap-1 rounded-control border border-hairline-soft px-4 py-3">
              <span className="text-xs text-muted">{figure.label}</span>
              <span className="text-lg text-ink tabular-nums">{formatMoney(figure.value)}</span>
              <span className="text-xs text-muted">{figure.hint}</span>
            </div>
          ))}
        </div>
        <ul className="flex flex-col gap-2">
          {match.issues.length === 0 ? (
            <li className="flex items-start gap-2 text-sm text-ink">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" />
              The invoice net equals the accepted goods at PO prices, and no receipt is billed twice.
            </li>
          ) : (
            match.issues.map((issue) => (
              <li key={issue} className="flex items-start gap-2 text-sm text-danger">
                <XCircle size={16} className="mt-0.5 shrink-0" />
                {issue}
              </li>
            ))
          )}
        </ul>
        <div className="flex flex-col divide-y divide-hairline-soft rounded-control border border-hairline-soft">
          {receipts.map((receipt) => (
            <div key={receipt.uuid} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
              <span dir="ltr" className="font-medium text-ink">
                {receipt.number}
              </span>
              <span className="text-secondary">
                Received {formatDate(receipt.receivedAt)} by {receipt.receivedBy} · {formatNumber(sumBy(receipt.lines, (l) => l.acceptedQty))} accepted of{" "}
                {formatNumber(sumBy(receipt.lines, (l) => l.receivedQty))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
