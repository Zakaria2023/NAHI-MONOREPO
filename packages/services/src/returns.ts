import { formatMoney, generateUuid, nextDocumentNumber, nowIso, round2, sumBy } from "utils";
import { SupplierReturnInput } from "validators";
import { readStore, transact } from "../../../db";
import { SUPPLIER_RETURN_REMEDY_LABELS } from "../../../db/label";
import { GoodsReceipt, PurchaseOrder, Store, Supplier, SupplierReturn } from "../../../db/types";
import { Actor } from "./core/actor";
import { logActivity } from "./core/activity";
import { assertRole, findOrThrow } from "./core/lookup";
import { PROCUREMENT_EDITORS, WAREHOUSE_EDITORS } from "./core/roles";
import { addMovement, stockBalance } from "./core/stock";
import { withVat } from "./core/tax";
import { linesTotal, receiptState } from "./rules/procurement";

// RETURNS TO THE SUPPLIER (procurement §1, other cases: "non-conforming or
// rejected supply — returned to the supplier with a debit note or a
// replacement").
//
//   rejected at receipt — never entered stock; the PO stays open for it, and the
//                         return settles itself once the PO is fully received
//   from stock          — found faulty later; taken out of stock now, then either
//                         a debit note (set off against the supplier's next
//                         invoice) or a replacement received back into stock

export type SupplierReturnRow = SupplierReturn & {
  supplierName: Supplier["name"];
  poNumber: PurchaseOrder["number"];
  warehouseCode: string;
  /** What is still to be deducted from the supplier's invoices. */
  openBalance: number;
};

const RETURNERS = [...WAREHOUSE_EDITORS, ...PROCUREMENT_EDITORS];

const log = (store: Store, actor: Actor, ret: SupplierReturn, action: string, detail?: string) =>
  logActivity(store, {
    actorName: actor.name,
    entity: "supplier_return",
    entityUuid: ret.uuid,
    entityLabel: ret.number,
    action,
    detail,
  });

const openBalanceOf = (ret: SupplierReturn): number =>
  ret.remedy === "debit_note" ? round2(ret.total - sumBy(ret.appliedToInvoices, (a) => a.amount)) : 0;

const toRow = (store: Store, ret: SupplierReturn): SupplierReturnRow => ({
  ...ret,
  supplierName: findOrThrow(store.Suppliers, ret.supplierUuid, "Supplier").name,
  poNumber: findOrThrow(store.PurchaseOrders, ret.poUuid, "Purchase order").number,
  warehouseCode: findOrThrow(store.Warehouses, ret.warehouseUuid, "Warehouse").code,
  openBalance: openBalanceOf(ret),
});

export const listSupplierReturns = async (): Promise<SupplierReturnRow[]> => {
  const store = readStore();
  return [...store.SupplierReturns].reverse().map((r) => toRow(store, r));
};

export const listPurchaseOrderReturns = (store: Store, poUuid: string): SupplierReturnRow[] =>
  store.SupplierReturns.filter((r) => r.poUuid === poUuid).map((r) => toRow(store, r));

/** Open debit notes, oldest first, set off against a new invoice of the same supplier. Returns what was deducted. */
export const applyDebitNotes = (store: Store, supplierUuid: string, invoiceUuid: string, available: number): number => {
  let left = round2(available);
  for (const ret of store.SupplierReturns.filter((r) => r.supplierUuid === supplierUuid && openBalanceOf(r) > 0)) {
    if (left <= 0) {
      break;
    }
    const amount = round2(Math.min(left, openBalanceOf(ret)));
    ret.appliedToInvoices.push({ invoiceUuid, amount });
    left = round2(left - amount);
  }
  return round2(available - left);
};

/** Called by receiving: the rejected quantities of a receipt go back as a return note. */
export const recordRejectedAtReceipt = (store: Store, actor: Actor, po: PurchaseOrder, receipt: GoodsReceipt): void => {
  const lines = receipt.lines
    .filter((l) => l.receivedQty > l.acceptedQty)
    .map((l) => ({
      itemUuid: l.itemUuid,
      qty: round2(l.receivedQty - l.acceptedQty),
      unitPrice: po.lines.find((p) => p.itemUuid === l.itemUuid)?.unitPrice ?? 0,
    }));
  if (lines.length === 0) {
    return;
  }
  const subtotal = linesTotal(lines);
  const ret: SupplierReturn = {
    uuid: generateUuid(),
    number: nextDocumentNumber("RTN", store.SupplierReturns.map((r) => r.number)),
    poUuid: po.uuid,
    supplierUuid: po.supplierUuid,
    grnUuid: receipt.uuid,
    warehouseUuid: receipt.warehouseUuid,
    source: "rejected_at_receipt",
    lines,
    reason: receipt.lines.map((l) => l.rejectionReason).filter(Boolean).join("; ") || "Failed the receiving check",
    remedy: "replacement",
    status: "awaiting_replacement",
    subtotal,
    ...withVat(subtotal),
    appliedToInvoices: [],
    createdBy: actor.name,
    createdAt: receipt.receivedAt,
  };
  store.SupplierReturns.push(ret);
  log(store, actor, ret, "Rejected goods returned to supplier", `${receipt.number} — awaiting re-delivery on ${po.number}`);
};

/** Called by receiving: once the PO is fully received, the re-delivery of rejected goods is complete. */
export const settleRedelivered = (store: Store, po: PurchaseOrder, at: string): void => {
  const state = receiptState(po, store.GoodsReceipts);
  for (const ret of store.SupplierReturns.filter(
    (r) => r.poUuid === po.uuid && r.source === "rejected_at_receipt" && r.status === "awaiting_replacement",
  )) {
    if (ret.lines.every((l) => (state.find((s) => s.itemUuid === l.itemUuid)?.outstanding ?? 0) === 0)) {
      ret.status = "settled";
      ret.settledAt = at;
    }
  }
};

/** Goods found faulty after they went into stock, sent back for a debit note or a replacement. */
export const returnToSupplier = async (actor: Actor, poUuid: string, input: SupplierReturnInput): Promise<SupplierReturn> => {
  assertRole(actor.role, RETURNERS, "return goods to suppliers");
  return transact((store) => {
    const po = findOrThrow(store.PurchaseOrders, poUuid, "Purchase order");
    const warehouse = findOrThrow(store.Warehouses, input.warehouseUuid, "Warehouse");
    const line = po.lines.find((l) => l.itemUuid === input.itemUuid);
    if (!line) {
      throw new Error("The item is not on this PO");
    }
    const accepted = receiptState(po, store.GoodsReceipts).find((s) => s.itemUuid === input.itemUuid)?.accepted ?? 0;
    const returnedBefore = sumBy(
      store.SupplierReturns.filter((r) => r.poUuid === poUuid && r.source === "from_stock").flatMap((r) => r.lines),
      (l) => (l.itemUuid === input.itemUuid ? l.qty : 0),
    );
    if (input.qty > accepted - returnedBefore + 0.005) {
      throw new Error(`Only ${round2(accepted - returnedBefore)} of the item was received on this PO and not yet returned`);
    }
    const inStock = stockBalance(store, input.itemUuid, warehouse.uuid);
    if (input.qty > inStock + 0.005) {
      throw new Error(`${warehouse.code} holds only ${inStock} of the item`);
    }
    const lines = [{ itemUuid: input.itemUuid, qty: input.qty, unitPrice: line.unitPrice }];
    const subtotal = linesTotal(lines);
    const now = nowIso();
    const debitNote = input.remedy === "debit_note";
    const ret: SupplierReturn = {
      uuid: generateUuid(),
      number: nextDocumentNumber("RTN", store.SupplierReturns.map((r) => r.number)),
      poUuid,
      supplierUuid: po.supplierUuid,
      warehouseUuid: warehouse.uuid,
      source: "from_stock",
      lines,
      reason: input.reason,
      remedy: input.remedy,
      status: debitNote ? "settled" : "awaiting_replacement",
      subtotal,
      ...withVat(subtotal),
      debitNoteNumber: debitNote
        ? nextDocumentNumber("DN", store.SupplierReturns.flatMap((r) => (r.debitNoteNumber ? [r.debitNoteNumber] : [])))
        : undefined,
      appliedToInvoices: [],
      createdBy: actor.name,
      createdAt: now,
      settledAt: debitNote ? now : undefined,
    };
    store.SupplierReturns.push(ret);
    addMovement(store, {
      type: "return",
      itemUuid: input.itemUuid,
      warehouseUuid: warehouse.uuid,
      qty: -input.qty,
      unitCost: line.unitPrice,
      refKind: "supplier_return",
      refUuid: ret.uuid,
      refNumber: ret.number,
      projectUuid: po.projectUuid,
      at: now,
      by: actor.name,
    });
    log(
      store,
      actor,
      ret,
      `Returned to supplier — ${SUPPLIER_RETURN_REMEDY_LABELS[input.remedy].toLowerCase()}`,
      debitNote ? `${ret.debitNoteNumber} for ${formatMoney(ret.total)}, deducted from the next invoice` : input.reason,
    );
    return ret;
  });
};

/** The replacement for a return from stock arrives: back into stock, the return settled. */
export const receiveReplacement = async (actor: Actor, uuid: string): Promise<void> => {
  assertRole(actor.role, WAREHOUSE_EDITORS, "receive replacements");
  transact((store) => {
    const ret = findOrThrow(store.SupplierReturns, uuid, "Return");
    if (ret.source !== "from_stock" || ret.status !== "awaiting_replacement") {
      throw new Error("This return is not waiting for a replacement");
    }
    const po = findOrThrow(store.PurchaseOrders, ret.poUuid, "Purchase order");
    const now = nowIso();
    for (const line of ret.lines) {
      addMovement(store, {
        type: "receipt",
        itemUuid: line.itemUuid,
        warehouseUuid: ret.warehouseUuid,
        qty: line.qty,
        unitCost: line.unitPrice,
        refKind: "supplier_return",
        refUuid: ret.uuid,
        refNumber: ret.number,
        projectUuid: po.projectUuid,
        at: now,
        by: actor.name,
      });
    }
    ret.status = "settled";
    ret.settledAt = now;
    log(store, actor, ret, "Replacement received into stock");
  });
};
