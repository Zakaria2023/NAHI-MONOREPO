import { round2, sumBy } from "utils";
import { GoodsReceipt, PricedLine, PurchaseOrder, Quotation, SupplierContract } from "../../../../db/types";

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

export type LatePenalty = {
  daysLate: number;
  amount: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

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

/**
 * Other cases — late supplier: the contract's penalty, a % of the invoiced value
 * for each day the last receipt on the invoice came after the expected delivery,
 * capped at the contract's ceiling. No terms, or on time, means no penalty.
 */
export const latePenaltyFor = (
  po: Pick<PurchaseOrder, "expectedDeliveryAt" | "latePenaltyPctPerDay" | "latePenaltyCapPct">,
  receipts: Pick<GoodsReceipt, "receivedAt">[],
  invoicedSubtotal: number,
): LatePenalty => {
  const rate = po.latePenaltyPctPerDay ?? 0;
  if (rate <= 0 || !po.expectedDeliveryAt || receipts.length === 0) {
    return { daysLate: 0, amount: 0 };
  }
  const last = Math.max(...receipts.map((r) => new Date(r.receivedAt).getTime()));
  const daysLate = Math.ceil((last - new Date(po.expectedDeliveryAt).getTime()) / DAY_MS);
  if (daysLate <= 0) {
    return { daysLate: 0, amount: 0 };
  }
  const cap = (invoicedSubtotal * (po.latePenaltyCapPct ?? 10)) / 100;
  return { daysLate, amount: round2(Math.min((invoicedSubtotal * rate * daysLate) / 100, cap)) };
};

/** Why a call-off under this contract cannot cover these lines on `at`, or null. */
export const contractCoverageBlocker = (
  contract: Pick<SupplierContract, "startsAt" | "endsAt" | "lines">,
  lines: { itemUuid: string }[],
  at: string,
): string | null => {
  if (at < contract.startsAt || at > contract.endsAt) {
    return "The contract is not in force today";
  }
  const missing = lines.filter((l) => !contract.lines.some((c) => c.itemUuid === l.itemUuid));
  return missing.length > 0 ? "The contract does not price every item on the request" : null;
};

/**
 * Other cases — modifying a PO: possible until it is fully received, never below
 * what has already been accepted, and only if something actually changes.
 */
export const amendmentBlocker = (
  po: PurchaseOrder,
  receipts: GoodsReceipt[],
  lines: PricedLine[],
  deliveryDays: number,
): string | null => {
  if (!["pending_approval", "approved", "sent", "partially_received"].includes(po.status)) {
    return "Only an open PO that is not fully received can be modified";
  }
  if (lines.length === 0) {
    return "A PO needs at least one line";
  }
  const state = receiptState(po, receipts);
  for (const s of state) {
    const next = lines.find((l) => l.itemUuid === s.itemUuid);
    if (s.accepted > 0 && (!next || next.qty < s.accepted)) {
      return "A line cannot go below what has already been received";
    }
  }
  const same =
    deliveryDays === po.deliveryDays &&
    lines.length === po.lines.length &&
    lines.every((l) => po.lines.some((p) => p.itemUuid === l.itemUuid && p.qty === l.qty && p.unitPrice === l.unitPrice));
  return same ? "Nothing was changed" : null;
};
