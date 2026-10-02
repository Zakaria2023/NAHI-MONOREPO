import { addDays, generateUuid, round2 } from "utils";
import { StaffRole } from "./enum";
import { PricedLine, Store, SupplierReturn } from "./types";

// DEMO DATA for the parts built after the first MVP: annual contracts and
// supplier returns. Each record is placed to show one screen or rule.

const VAT = 0.15;

export const addExtraDemoData = (store: Store, now: string): void => {
  const ago = (days: number): string => addDays(now, -days);
  const ahead = (days: number): string => addDays(now, days);
  const find = <T>(rows: T[], match: (row: T) => boolean, what: string): T => {
    const row = rows.find(match);
    if (!row) {
      throw new Error(`Extra seed is missing ${what}`);
    }
    return row;
  };
  const nameOf = (role: StaffRole): string => find(store.StaffUsers, (u) => u.role === role, role).name;
  const item = (code: string) => find(store.Items, (i) => i.code === code, code);
  const supplier = (name: string) => find(store.Suppliers, (s) => s.name === name, name);
  const po = (number: string) => find(store.PurchaseOrders, (p) => p.number === number, number);
  const ruh = find(store.Warehouses, (w) => w.code === "WH-RUH", "WH-RUH");

  // ─── Annual contracts ────────────────────────────────────────────────────

  store.SupplierContracts = [
    {
      // Prices both items of PR-0002 (in RFQ): that request can be ordered under
      // it. Ends in 20 days, so its renewal alert is live.
      uuid: generateUuid(),
      number: "AC-0001",
      supplierUuid: supplier("Najd Civil Supplies").uuid,
      title: "Manholes and duct — 2025/26",
      startsAt: ago(345),
      endsAt: ahead(20),
      lines: [
        { itemUuid: item("MHL-001").uuid, unitPrice: 1390 },
        { itemUuid: item("DUC-040").uuid, unitPrice: 2.9 },
      ],
      deliveryDays: 10,
      paymentTermsDays: 45,
      latePenaltyPctPerDay: 0.5,
      latePenaltyCapPct: 10,
      createdBy: nameOf("procurement"),
      createdAt: ago(350),
    },
    {
      uuid: generateUuid(),
      number: "AC-0002",
      supplierUuid: supplier("Arab Cables Co.").uuid,
      title: "Fiber cable and splice closures — 2026",
      startsAt: ago(45),
      endsAt: ahead(320),
      lines: [
        { itemUuid: item("FIB-048").uuid, unitPrice: 4.05 },
        { itemUuid: item("FIB-096").uuid, unitPrice: 6.5 },
        { itemUuid: item("SPC-024").uuid, unitPrice: 170 },
      ],
      deliveryDays: 14,
      paymentTermsDays: 60,
      latePenaltyPctPerDay: 0.25,
      latePenaltyCapPct: 5,
      createdBy: nameOf("procurement"),
      createdAt: ago(50),
    },
  ];

  // PO-0001 is late: with these terms its next invoice carries a penalty.
  const po1 = po("PO-0001");
  po1.latePenaltyPctPerDay = 0.5;
  po1.latePenaltyCapPct = 10;

  // ─── Returns to suppliers ────────────────────────────────────────────────

  const priced = (number: string, code: string, qty: number): PricedLine => ({
    itemUuid: item(code).uuid,
    qty,
    unitPrice: find(po(number).lines, (l) => l.itemUuid === item(code).uuid, `${number} ${code}`).unitPrice,
  });
  const totals = (lines: PricedLine[]) => {
    const subtotal = round2(lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0));
    return { subtotal, vat: round2(subtotal * VAT), total: round2(subtotal * (1 + VAT)) };
  };
  const grn1 = find(store.GoodsReceipts, (g) => g.number === "GRN-0001", "GRN-0001");
  const po4 = po("PO-0004");

  const rejected: PricedLine[] = [priced("PO-0001", "DUC-040", 20)];
  const debit: PricedLine[] = [priced("PO-0004", "SPC-024", 2)];
  const replace: PricedLine[] = [priced("PO-0004", "TAP-001", 5)];

  const returns: SupplierReturn[] = [
    {
      // The 20 m crushed in transit on GRN-0001: back to the supplier, still owed on PO-0001.
      uuid: generateUuid(),
      number: "RTN-0001",
      poUuid: po1.uuid,
      supplierUuid: po1.supplierUuid,
      grnUuid: grn1.uuid,
      warehouseUuid: grn1.warehouseUuid,
      source: "rejected_at_receipt",
      lines: rejected,
      reason: "20 m crushed in transit",
      remedy: "replacement",
      status: "awaiting_replacement",
      ...totals(rejected),
      appliedToInvoices: [],
      createdBy: grn1.receivedBy,
      createdAt: grn1.receivedAt,
    },
    {
      // Faulty closures found in stock: a debit note, open until the next Arab Cables invoice.
      uuid: generateUuid(),
      number: "RTN-0002",
      poUuid: po4.uuid,
      supplierUuid: po4.supplierUuid,
      warehouseUuid: ruh.uuid,
      source: "from_stock",
      lines: debit,
      reason: "Cracked housings found at issue",
      remedy: "debit_note",
      status: "settled",
      ...totals(debit),
      debitNoteNumber: "DN-0001",
      appliedToInvoices: [],
      createdBy: nameOf("warehouse_keeper"),
      createdAt: ago(10),
      settledAt: ago(10),
    },
    {
      // Wrong tape colour: the replacement has not arrived yet.
      uuid: generateUuid(),
      number: "RTN-0003",
      poUuid: po4.uuid,
      supplierUuid: po4.supplierUuid,
      warehouseUuid: ruh.uuid,
      source: "from_stock",
      lines: replace,
      reason: "Wrong colour — blue tape delivered, yellow ordered",
      remedy: "replacement",
      status: "awaiting_replacement",
      ...totals(replace),
      appliedToInvoices: [],
      createdBy: nameOf("warehouse_keeper"),
      createdAt: ago(4),
    },
  ];
  store.SupplierReturns = returns;

  for (const ret of returns.filter((r) => r.source === "from_stock")) {
    for (const line of ret.lines) {
      store.StockMovements.push({
        uuid: generateUuid(),
        type: "return",
        itemUuid: line.itemUuid,
        warehouseUuid: ret.warehouseUuid,
        qty: -line.qty,
        unitCost: line.unitPrice,
        refKind: "supplier_return",
        refUuid: ret.uuid,
        refNumber: ret.number,
        projectUuid: po4.projectUuid,
        at: ret.createdAt,
        by: ret.createdBy,
      });
    }
  }
};
