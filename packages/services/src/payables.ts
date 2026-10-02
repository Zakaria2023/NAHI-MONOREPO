import { addDays, formatMoney, generateUuid, nextDocumentNumber, nowIso, round2, sumBy, toIso } from "utils";
import { PaymentInput, SupplierInvoiceInput } from "validators";
import { readStore, transact } from "../../../db";
import { PAYMENT_METHOD_LABELS } from "../../../db/label";
import { GoodsReceipt, PurchaseOrder, Store, Supplier, SupplierInvoice } from "../../../db/types";
import { Actor } from "./core/actor";
import { logActivity } from "./core/activity";
import { assertNotFuture, assertRole, findOrThrow } from "./core/lookup";
import { FINANCE_EDITORS } from "./core/roles";
import { applyDebitNotes } from "./returns";
import { latePenaltyFor } from "./rules/procurement";
import {
  AgeingBuckets,
  advanceToRecover,
  ageing,
  duplicateInvoiceBlocker,
  supplierDataBlocker,
  threeWayMatch,
  vatBlocker,
} from "./rules/finance";

// ACCOUNTS PAYABLE (finance §1): register with the mandatory-field and duplicate
// controls, three-way match, advance recovery, the weekly due schedule, payment
// with its e-mailed notice, and the supplier statement.

export type SupplierInvoiceRow = SupplierInvoice & {
  supplierName: Supplier["name"];
  poNumber: PurchaseOrder["number"];
  paid: number;
  outstanding: number;
  overdue: boolean;
};

export type SupplierInvoiceDetail = {
  invoice: SupplierInvoiceRow;
  supplier: Supplier;
  po: PurchaseOrder;
  receipts: GoodsReceipt[];
  match: { expected: number; issues: string[] };
};

export type InvoiceableReceipts = {
  po: Pick<PurchaseOrder, "uuid" | "number" | "supplierUuid" | "advancePaid">;
  receipts: (Pick<GoodsReceipt, "uuid" | "number" | "receivedAt"> & { value: number })[];
};

export type DueWeek = {
  /** Monday of the week, ISO. */
  weekOf: string;
  invoices: SupplierInvoiceRow[];
  total: number;
};

export type SupplierAgeingRow = { supplierUuid: string; supplierName: string } & AgeingBuckets;

export type StatementRow = {
  at: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
};

/** Who approves supplier invoices ("the competent party", §1 step 4). */
const INVOICE_APPROVERS = ["finance_manager"] as const;

const paidOf = (invoice: SupplierInvoice): number => round2(sumBy(invoice.payments, (p) => p.amount));

const toRow = (store: Store, invoice: SupplierInvoice, now: string): SupplierInvoiceRow => {
  const paid = paidOf(invoice);
  const outstanding = round2(invoice.netPayable - paid);
  return {
    ...invoice,
    supplierName: findOrThrow(store.Suppliers, invoice.supplierUuid, "Supplier").name,
    poNumber: findOrThrow(store.PurchaseOrders, invoice.poUuid, "Purchase order").number,
    paid,
    outstanding,
    overdue: outstanding > 0 && invoice.status !== "rejected" && invoice.dueDate < now,
  };
};

const invoicedGrnUuids = (store: Store, exceptInvoiceUuid?: string): string[] =>
  store.SupplierInvoices.filter((i) => i.status !== "rejected" && i.uuid !== exceptInvoiceUuid).flatMap(
    (i) => i.grnUuids,
  );

const log = (store: Store, actor: Actor, invoice: SupplierInvoice, action: string, detail?: string) =>
  logActivity(store, {
    actorName: actor.name,
    entity: "supplier_invoice",
    entityUuid: invoice.uuid,
    entityLabel: invoice.number,
    action,
    detail,
  });

export const listSupplierInvoices = async (): Promise<SupplierInvoiceRow[]> => {
  const store = readStore();
  const now = nowIso();
  return [...store.SupplierInvoices].reverse().map((i) => toRow(store, i, now));
};

export const getSupplierInvoice = async (uuid: string): Promise<SupplierInvoiceDetail> => {
  const store = readStore();
  const invoice = findOrThrow(store.SupplierInvoices, uuid, "Invoice");
  const po = findOrThrow(store.PurchaseOrders, invoice.poUuid, "Purchase order");
  const receipts = store.GoodsReceipts.filter((r) => invoice.grnUuids.includes(r.uuid));
  return {
    invoice: toRow(store, invoice, nowIso()),
    supplier: findOrThrow(store.Suppliers, invoice.supplierUuid, "Supplier"),
    po,
    receipts,
    match: threeWayMatch(po, receipts, invoice.subtotal, invoicedGrnUuids(store, invoice.uuid)),
  };
};

/** For the register form: each PO's receipts not yet on an invoice, with their value. */
export const listInvoiceableReceipts = async (): Promise<InvoiceableReceipts[]> => {
  const store = readStore();
  const used = invoicedGrnUuids(store);
  return store.PurchaseOrders.map((po) => ({
    po: { uuid: po.uuid, number: po.number, supplierUuid: po.supplierUuid, advancePaid: po.advancePaid },
    receipts: store.GoodsReceipts.filter((r) => r.poUuid === po.uuid && !used.includes(r.uuid)).map((r) => ({
      uuid: r.uuid,
      number: r.number,
      receivedAt: r.receivedAt,
      value: threeWayMatch(po, [r], 0, []).expected,
    })),
  })).filter((row) => row.receipts.length > 0);
};

/**
 * §1 steps 1–6 in one go: the controls refuse a bad invoice outright, the match
 * must hold, the advance is recovered, and the due date comes from the PO terms.
 */
export const registerSupplierInvoice = async (
  actor: Actor,
  input: SupplierInvoiceInput,
): Promise<SupplierInvoice> => {
  assertRole(actor.role, FINANCE_EDITORS, "register supplier invoices");
  const invoiceDate = toIso(input.invoiceDate);
  assertNotFuture(invoiceDate);
  return transact((store) => {
    const supplier = findOrThrow(store.Suppliers, input.supplierUuid, "Supplier");
    const po = findOrThrow(store.PurchaseOrders, input.poUuid, "Purchase order");
    const blocker =
      supplierDataBlocker(supplier) ??
      duplicateInvoiceBlocker(store.SupplierInvoices, supplier.uuid, input.invoiceNumber) ??
      vatBlocker(input.subtotal, input.vat, input.total) ??
      (po.supplierUuid === supplier.uuid ? null : "The PO was issued to a different supplier");
    if (blocker) {
      throw new Error(blocker);
    }
    const receipts = input.grnUuids.map((uuid) => findOrThrow(store.GoodsReceipts, uuid, "Goods receipt"));
    const match = threeWayMatch(po, receipts, input.subtotal, invoicedGrnUuids(store));
    if (match.issues.length > 0) {
      throw new Error(`Three-way match failed: ${match.issues.join("; ")}`);
    }
    const recovered = sumBy(
      store.SupplierInvoices.filter((i) => i.poUuid === po.uuid && i.status !== "rejected"),
      (i) => i.advanceDeducted,
    );
    const advanceDeducted = advanceToRecover(po, recovered, input.total);
    const penalty = latePenaltyFor(po, receipts, input.subtotal);
    const uuid = generateUuid();
    const debitNotesDeducted = applyDebitNotes(
      store,
      supplier.uuid,
      uuid,
      Math.max(0, round2(input.total - advanceDeducted - penalty.amount)),
    );
    const invoice: SupplierInvoice = {
      uuid,
      number: nextDocumentNumber("AP", store.SupplierInvoices.map((i) => i.number)),
      supplierUuid: supplier.uuid,
      invoiceNumber: input.invoiceNumber.trim(),
      invoiceDate,
      poUuid: po.uuid,
      grnUuids: input.grnUuids,
      subtotal: round2(input.subtotal),
      vat: round2(input.vat),
      total: round2(input.total),
      advanceDeducted,
      latePenalty: penalty.amount,
      debitNotesDeducted,
      netPayable: round2(input.total - advanceDeducted - penalty.amount - debitNotesDeducted),
      dueDate: addDays(invoiceDate, po.paymentTermsDays),
      status: "registered",
      payments: [],
      registeredBy: actor.name,
      createdAt: nowIso(),
    };
    store.SupplierInvoices.push(invoice);
    log(
      store,
      actor,
      invoice,
      "Invoice registered and matched",
      [
        advanceDeducted > 0 && `Advance ${formatMoney(advanceDeducted)} recovered`,
        penalty.amount > 0 && `Late penalty ${formatMoney(penalty.amount)} (${penalty.daysLate} day(s) late)`,
        debitNotesDeducted > 0 && `Debit notes ${formatMoney(debitNotesDeducted)} set off`,
      ]
        .filter(Boolean)
        .join(" · ") || undefined,
    );
    return invoice;
  });
};

export const approveSupplierInvoice = async (actor: Actor, uuid: string): Promise<void> => {
  assertRole(actor.role, [...INVOICE_APPROVERS], "approve supplier invoices");
  transact((store) => {
    const invoice = findOrThrow(store.SupplierInvoices, uuid, "Invoice");
    if (invoice.status !== "registered") {
      throw new Error("Only a registered invoice is approved");
    }
    invoice.status = "approved";
    invoice.approvedBy = actor.name;
    log(store, actor, invoice, "Approved — added to the due schedule");
  });
};

/** §1 steps 7–8: the payment, matched to the invoice, and the notice e-mailed. */
export const recordSupplierPayment = async (actor: Actor, uuid: string, input: PaymentInput): Promise<void> => {
  assertRole(actor.role, FINANCE_EDITORS, "record payments");
  const at = toIso(input.paidAt);
  assertNotFuture(at);
  transact((store) => {
    const invoice = findOrThrow(store.SupplierInvoices, uuid, "Invoice");
    if (invoice.status !== "approved") {
      throw new Error("Payments are made against an approved invoice");
    }
    const outstanding = round2(invoice.netPayable - paidOf(invoice));
    if (input.amount > outstanding + 0.005) {
      throw new Error(`Only ${formatMoney(outstanding)} is outstanding`);
    }
    const supplier = findOrThrow(store.Suppliers, invoice.supplierUuid, "Supplier");
    invoice.payments.push({
      uuid: generateUuid(),
      at,
      method: input.method,
      reference: input.reference,
      amount: round2(input.amount),
      by: actor.name,
      noticeSentAt: nowIso(),
    });
    if (round2(invoice.netPayable - paidOf(invoice)) <= 0) {
      invoice.status = "paid";
    }
    log(
      store,
      actor,
      invoice,
      `Paid by ${PAYMENT_METHOD_LABELS[input.method].toLowerCase()}`,
      `${formatMoney(input.amount)} — notice e-mailed to ${supplier.email}`,
    );
  });
};

/** §1 step 6: the weekly due schedule, every approved invoice in its due week. */
export const weeklyDueSchedule = async (): Promise<DueWeek[]> => {
  const store = readStore();
  const now = nowIso();
  const rows = store.SupplierInvoices.filter((i) => i.status === "approved").map((i) => toRow(store, i, now));
  const weeks = new Map<string, SupplierInvoiceRow[]>();
  for (const row of rows) {
    const due = new Date(row.dueDate);
    const monday = new Date(Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate() - ((due.getUTCDay() + 6) % 7)));
    const key = monday.toISOString();
    weeks.set(key, [...(weeks.get(key) ?? []), row]);
  }
  return [...weeks.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekOf, invoices]) => ({ weekOf, invoices, total: round2(sumBy(invoices, (i) => i.outstanding)) }));
};

export const supplierAgeing = async (): Promise<SupplierAgeingRow[]> => {
  const store = readStore();
  const now = nowIso();
  return store.Suppliers.map((s) => {
    const open = store.SupplierInvoices.filter((i) => i.supplierUuid === s.uuid && i.status !== "rejected" && i.status !== "paid");
    return {
      supplierUuid: s.uuid,
      supplierName: s.name,
      ...ageing(open.map((i) => ({ dueAt: i.dueDate, outstanding: round2(i.netPayable - paidOf(i)) })), now),
    };
  }).filter((row) => row.total > 0);
};

/** §1 step 9: the statement the supplier's own is reconciled against. */
export const supplierStatement = async (supplierUuid: string): Promise<StatementRow[]> => {
  const store = readStore();
  const entries = store.SupplierInvoices.filter((i) => i.supplierUuid === supplierUuid && i.status !== "rejected").flatMap(
    (i) => [
      { at: i.invoiceDate, reference: i.invoiceNumber, description: `Invoice ${i.number}`, debit: 0, credit: i.total },
      ...(i.advanceDeducted > 0
        ? [{ at: i.invoiceDate, reference: i.number, description: "Advance recovered", debit: i.advanceDeducted, credit: 0 }]
        : []),
      ...((i.latePenalty ?? 0) > 0
        ? [{ at: i.invoiceDate, reference: i.number, description: "Late delivery penalty", debit: i.latePenalty ?? 0, credit: 0 }]
        : []),
      ...i.payments.map((p) => ({
        at: p.at,
        reference: p.reference,
        description: `Payment — ${PAYMENT_METHOD_LABELS[p.method]}`,
        debit: p.amount,
        credit: 0,
      })),
    ],
  );
  const debitNotes = store.SupplierReturns.filter((r) => r.supplierUuid === supplierUuid && r.debitNoteNumber).map((r) => ({
    at: r.createdAt,
    reference: r.debitNoteNumber ?? r.number,
    description: `Debit note — goods returned (${r.number})`,
    debit: r.total,
    credit: 0,
  }));
  let balance = 0;
  return [...entries, ...debitNotes]
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((e) => {
      balance = round2(balance + e.credit - e.debit);
      return { ...e, balance };
    });
};
