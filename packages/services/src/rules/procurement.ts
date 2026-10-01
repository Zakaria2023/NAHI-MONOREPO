import { round2, sumBy } from "utils";
import { GoodsReceipt, PricedLine, PurchaseOrder, Quotation } from "../../../../db/types";

// THE PURCHASING RULES (docs/procurement-warehouse-custody.md §1–2).

export type QuotationComparison = {
  quotationUuid: string;
  supplierUuid: string;
  total: number;
  deliveryDays: number;
  paymentTermsDays: number;
  qualityScore: number;
  previouslyApproved: boolean;
  /** The best offer on each criterion of step 5, for highlighting. */
  best: { price: boolean; delivery: boolean; terms: boolean; quality: boolean };
};

export type ReceiptLineState = {
  itemUuid: string;
  ordered: number;
  received: number;
  accepted: number;
  outstanding: number;
};

/** Step 4: at least three suppliers, or one previously approved quotation. */
export const MIN_QUOTATIONS = 3;

export const linesTotal = (lines: PricedLine[]): number =>
  round2(sumBy(lines, (line) => line.qty * line.unitPrice));

export const rfqBlocker = (quotations: Quotation[]): string | null => {
  if (quotations.some((q) => q.previouslyApproved)) {
    return null;
  }
  const suppliers = new Set(quotations.map((q) => q.supplierUuid)).size;
  return suppliers >= MIN_QUOTATIONS
    ? null
    : `Needs quotations from at least ${MIN_QUOTATIONS} suppliers (${suppliers} so far), or a previously approved quotation`;
};

/** Step 5: price, quality, delivery time, payment terms, side by side. */
export const compareQuotations = (quotations: Quotation[]): QuotationComparison[] => {
  const rows = quotations.map((q) => ({
    quotationUuid: q.uuid,
    supplierUuid: q.supplierUuid,
    total: linesTotal(q.lines),
    deliveryDays: q.deliveryDays,
    paymentTermsDays: q.paymentTermsDays,
    qualityScore: q.qualityScore,
    previouslyApproved: q.previouslyApproved,
  }));
  const min = (pick: (r: (typeof rows)[number]) => number) => Math.min(...rows.map(pick));
  const max = (pick: (r: (typeof rows)[number]) => number) => Math.max(...rows.map(pick));
  return rows
    .map((r) => ({
      ...r,
      best: {
        price: r.total === min((x) => x.total),
        delivery: r.deliveryDays === min((x) => x.deliveryDays),
        terms: r.paymentTermsDays === max((x) => x.paymentTermsDays),
        quality: r.qualityScore === max((x) => x.qualityScore),
      },
    }))
    .sort((a, b) => a.total - b.total);
};

/** How much of each PO line has been received and accepted so far. */
export const receiptState = (po: PurchaseOrder, receipts: GoodsReceipt[]): ReceiptLineState[] =>
  po.lines.map((line) => {
    const mine = receipts.filter((r) => r.poUuid === po.uuid).flatMap((r) => r.lines);
    const ofItem = mine.filter((l) => l.itemUuid === line.itemUuid);
    const received = round2(sumBy(ofItem, (l) => l.receivedQty));
    const accepted = round2(sumBy(ofItem, (l) => l.acceptedQty));
    return {
      itemUuid: line.itemUuid,
      ordered: line.qty,
      received,
      accepted,
      outstanding: round2(Math.max(0, line.qty - accepted)),
    };
  });

/** Why this receipt cannot be posted against the PO, or null. Rejected goods go back, so only accepted qty counts against the order. */
export const goodsReceiptBlocker = (
  po: PurchaseOrder,
  receipts: GoodsReceipt[],
  lines: { itemUuid: string; receivedQty: number; acceptedQty: number; rejectionReason?: string }[],
): string | null => {
  if (po.status !== "sent" && po.status !== "partially_received") {
    return "Goods are received against a PO that has been sent to the supplier";
  }
  const state = receiptState(po, receipts);
  if (lines.every((l) => l.receivedQty === 0)) {
    return "Enter the quantity received";
  }
  for (const line of lines) {
    const ordered = state.find((s) => s.itemUuid === line.itemUuid);
    if (!ordered) {
      return "An item on the receipt is not on the PO";
    }
    if (line.acceptedQty > line.receivedQty) {
      return "Accepted quantity cannot exceed the quantity received";
    }
    if (line.acceptedQty < line.receivedQty && !line.rejectionReason?.trim()) {
      return "Give the reason for every rejected quantity";
    }
    if (line.acceptedQty > ordered.outstanding) {
      return `Only ${ordered.outstanding} still outstanding on the PO for one of the items`;
    }
  }
  return null;
};
