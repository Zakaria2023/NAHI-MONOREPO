import { daysUntil, round2, sumBy } from "utils";
import {
  Extract,
  ExtractLine,
  GoodsReceipt,
  PurchaseOrder,
  Subcontract,
  Supplier,
  SupplierInvoice,
} from "../../../../db/types";
import { VAT_RATE } from "../core/tax";

// THE FINANCE RULES (docs/finance.md).

export type ThreeWayMatch = {
  /** What the linked receipts' accepted quantities are worth at the PO's prices. */
  expected: number;
  issues: string[];
};

export type ExtractFigures = Pick<
  Extract,
  "gross" | "advanceDeduction" | "retention" | "penalties" | "materialsDeduction" | "net"
>;

export type AgeingBuckets = {
  current: number;
  d1to30: number;
  d31to60: number;
  d61to90: number;
  over90: number;
  total: number;
};

/** A VAT figure may be off its exact 15 % by this much, for rounding on the supplier's side. */
const VAT_TOLERANCE = 0.05;

/** Mandatory fields (§1): VAT number, company details. An invoice from a supplier missing them is refused. */
export const supplierDataBlocker = (supplier: Supplier): string | null => {
  const missing = [
    !supplier.vatNumber.trim() && "VAT number",
    !supplier.name.trim() && "trade name",
    !supplier.address.trim() && "address",
    !supplier.crNumber.trim() && "CR number",
  ].filter(Boolean);
  return missing.length > 0 ? `The supplier record is missing: ${missing.join(", ")}` : null;
};

export const duplicateInvoiceBlocker = (
  invoices: SupplierInvoice[],
  supplierUuid: string,
  invoiceNumber: string,
): string | null =>
  invoices.some(
    (i) =>
      i.supplierUuid === supplierUuid &&
      i.invoiceNumber.trim().toLowerCase() === invoiceNumber.trim().toLowerCase(),
  )
    ? "This supplier's invoice number is already registered"
    : null;

/** VAT computed or entered, consistent with the net and the total. */
export const vatBlocker = (subtotal: number, vat: number, total: number): string | null => {
  if (Math.abs(round2(subtotal * VAT_RATE) - vat) > VAT_TOLERANCE) {
    return `VAT should be 15 % of the net (${round2(subtotal * VAT_RATE)})`;
  }
  if (Math.abs(round2(subtotal + vat) - total) > 0.01) {
    return "Net + VAT does not equal the total";
  }
  return null;
};

/** PO + receipt + invoice: the invoice bills exactly what was accepted, at the PO's prices. */
export const threeWayMatch = (
  po: PurchaseOrder,
  receipts: GoodsReceipt[],
  invoiceSubtotal: number,
  alreadyInvoicedGrnUuids: string[],
): ThreeWayMatch => {
  const issues: string[] = [];
  if (po.status === "pending_approval" || po.status === "rejected" || po.status === "cancelled") {
    issues.push("The PO is not approved");
  }
  if (receipts.some((r) => r.poUuid !== po.uuid)) {
    issues.push("A receipt belongs to a different PO");
  }
  if (receipts.some((r) => alreadyInvoicedGrnUuids.includes(r.uuid))) {
    issues.push("A receipt is already on another invoice");
  }
  const expected = round2(
    sumBy(
      receipts.flatMap((r) => r.lines),
      (line) => line.acceptedQty * (po.lines.find((l) => l.itemUuid === line.itemUuid)?.unitPrice ?? 0),
    ),
  );
  if (Math.abs(expected - invoiceSubtotal) > 0.01) {
    issues.push(`The invoice net (${invoiceSubtotal}) does not match the accepted goods at PO prices (${expected})`);
  }
  return { expected, issues };
};

/** §1 step 5: what is left of the PO's advance, up to the invoice total. */
export const advanceToRecover = (
  po: PurchaseOrder,
  recoveredSoFar: number,
  invoiceTotal: number,
): number => round2(Math.max(0, Math.min(po.advancePaid - recoveredSoFar, invoiceTotal)));

/**
 * §2 steps 3–6. The advance comes back in proportion to the extract's share of
 * the contract, capped at what is still unrecovered.
 */
export const extractFigures = (
  subcontract: Subcontract,
  lines: ExtractLine[],
  advanceRecoveredSoFar: number,
  penalties: number,
  materialsDeduction: number,
): ExtractFigures => {
  const gross = round2(sumBy(lines, (l) => l.qty * l.unitRate));
  const proportional = subcontract.value > 0 ? (subcontract.advancePaid * gross) / subcontract.value : 0;
  const advanceDeduction = round2(
    Math.max(0, Math.min(proportional, subcontract.advancePaid - advanceRecoveredSoFar)),
  );
  const retention = round2((gross * subcontract.retentionPct) / 100);
  const net = round2(gross - advanceDeduction - retention - penalties - materialsDeduction);
  return {
    gross,
    advanceDeduction,
    retention,
    penalties: round2(penalties),
    materialsDeduction: round2(materialsDeduction),
    net,
  };
};

/** Ageing by days past due. */
export const ageing = (rows: { dueAt: string; outstanding: number }[], now: string): AgeingBuckets => {
  const buckets: AgeingBuckets = { current: 0, d1to30: 0, d31to60: 0, d61to90: 0, over90: 0, total: 0 };
  for (const row of rows) {
    const overdue = -daysUntil(row.dueAt, now);
    const key: keyof AgeingBuckets =
      overdue <= 0 ? "current" : overdue <= 30 ? "d1to30" : overdue <= 60 ? "d31to60" : overdue <= 90 ? "d61to90" : "over90";
    buckets[key] = round2(buckets[key] + row.outstanding);
    buckets.total = round2(buckets.total + row.outstanding);
  }
  return buckets;
};
