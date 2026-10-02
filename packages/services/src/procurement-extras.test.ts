import { beforeEach, describe, expect, it } from "vitest";
import { readStore, resetStore, transact } from "../../../db";
import { StaffRole } from "../../../db/enum";
import { PurchaseOrder } from "../../../db/types";
import { createSupplierContract, orderUnderContract } from "./contracts";
import { Actor } from "./core/actor";
import { stockBalance } from "./core/stock";
import { registerSupplierInvoice } from "./payables";
import {
  amendPurchaseOrder,
  createPurchaseRequest,
  decidePurchaseRequest,
  receiveGoods,
  reviewPurchaseRequest,
  sendPurchaseOrder,
  setPenaltyTerms,
} from "./procurement";
import { receiveReplacement, returnToSupplier } from "./returns";
import { amendmentBlocker, contractCoverageBlocker, latePenaltyFor } from "./rules/procurement";

const as = (role: StaffRole): Actor => {
  const user = readStore().StaffUsers.find((u) => u.role === role);
  if (!user) {
    throw new Error(`no ${role}`);
  }
  return { uuid: user.uuid, name: user.name, role };
};

const byCode = <T extends { code: string }>(rows: T[], code: string): T => {
  const row = rows.find((r) => r.code === code);
  if (!row) {
    throw new Error(code);
  }
  return row;
};

const po = (number: string): PurchaseOrder => {
  const row = readStore().PurchaseOrders.find((p) => p.number === number);
  if (!row) {
    throw new Error(number);
  }
  return row;
};

const supplier = (name: string) => {
  const row = readStore().Suppliers.find((s) => s.name === name);
  if (!row) {
    throw new Error(name);
  }
  return row;
};

const today = () => new Date().toISOString().slice(0, 10);
const daysFromToday = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

/** PO-0003 (approved, 3,000 m of FIB-096 for STC-005) sent and fully received at WH-RUH. */
const receivePo3 = async () => {
  const order = po("PO-0003");
  await sendPurchaseOrder(as("procurement"), order.uuid);
  return receiveGoods(as("warehouse_keeper"), order.uuid, {
    warehouseUuid: byCode(readStore().Warehouses, "WH-RUH").uuid,
    receivedAt: today(),
    lines: order.lines.map((l) => ({ itemUuid: l.itemUuid, receivedQty: l.qty, acceptedQty: l.qty })),
  });
};

beforeEach(() => resetStore());

describe("late supplier penalty (procurement §1, other cases)", () => {
  const terms = { expectedDeliveryAt: "2026-09-10T00:00:00.000Z", latePenaltyPctPerDay: 0.5, latePenaltyCapPct: 10 };

  it("charges the contract rate for each day the goods came late", () => {
    expect(latePenaltyFor(terms, [{ receivedAt: "2026-09-13T00:00:00.000Z" }], 10000)).toEqual({ daysLate: 3, amount: 150 });
  });

  it("charges nothing on time, or without terms, and never above the cap", () => {
    expect(latePenaltyFor(terms, [{ receivedAt: "2026-09-09T00:00:00.000Z" }], 10000).amount).toBe(0);
    expect(latePenaltyFor({ ...terms, latePenaltyPctPerDay: 0 }, [{ receivedAt: "2026-09-30T00:00:00.000Z" }], 10000).amount).toBe(0);
    expect(latePenaltyFor(terms, [{ receivedAt: "2026-12-30T00:00:00.000Z" }], 10000).amount).toBe(1000);
  });

  it("is deducted from the invoice of a late delivery", async () => {
    const order = po("PO-0003");
    await setPenaltyTerms(as("procurement"), order.uuid, { latePenaltyPctPerDay: 1, latePenaltyCapPct: 10 });
    await sendPurchaseOrder(as("procurement"), order.uuid);
    transact((store) => {
      const row = store.PurchaseOrders.find((p) => p.uuid === order.uuid);
      if (row) {
        row.expectedDeliveryAt = new Date(Date.now() - 4 * 86400000).toISOString();
      }
    });
    const grn = await receiveGoods(as("warehouse_keeper"), order.uuid, {
      warehouseUuid: byCode(readStore().Warehouses, "WH-RUH").uuid,
      receivedAt: today(),
      lines: order.lines.map((l) => ({ itemUuid: l.itemUuid, receivedQty: l.qty, acceptedQty: l.qty })),
    });
    const invoice = await registerSupplierInvoice(as("accountant"), {
      supplierUuid: order.supplierUuid,
      invoiceNumber: "GF-LATE-1",
      invoiceDate: today(),
      poUuid: order.uuid,
      grnUuids: [grn.uuid],
      subtotal: 19800,
      vat: 2970,
      total: 22770,
    });
    expect(invoice.latePenalty).toBe(792);
    expect(invoice.netPayable).toBe(21978);
  });
});

describe("annual contracts (procurement §1, other cases)", () => {
  const contract = {
    title: "Manholes 2026",
    startsAt: daysFromToday(-30),
    endsAt: daysFromToday(300),
    deliveryDays: 10,
    paymentTermsDays: 45,
    latePenaltyPctPerDay: 0.5,
    latePenaltyCapPct: 10,
  };

  it("covers a request only while in force and only for the items it prices", () => {
    const lines = [{ itemUuid: "a", unitPrice: 1 }];
    const window = { startsAt: "2026-01-01T00:00:00.000Z", endsAt: "2026-12-31T23:59:59.999Z", lines };
    expect(contractCoverageBlocker(window, [{ itemUuid: "a" }], "2026-06-01T00:00:00.000Z")).toBeNull();
    expect(contractCoverageBlocker(window, [{ itemUuid: "a" }], "2027-01-02T00:00:00.000Z")).toMatch(/not in force/);
    expect(contractCoverageBlocker(window, [{ itemUuid: "b" }], "2026-06-01T00:00:00.000Z")).toMatch(/every item/);
  });

  it("raises a PO at the contract's prices and terms, skipping the RFQ", async () => {
    const items = readStore().Items;
    const signed = await createSupplierContract(as("procurement"), {
      ...contract,
      supplierUuid: supplier("Najd Civil Supplies").uuid,
      lines: [{ itemUuid: byCode(items, "MHL-001").uuid, unitPrice: 1200 }],
    });
    const pr = await createPurchaseRequest(as("project_manager"), {
      projectUuid: byCode(readStore().Projects, "MOB-001").uuid,
      department: "Projects",
      budgetCategory: "civil_materials",
      lines: [{ itemUuid: byCode(items, "MHL-001").uuid, qty: 2, estUnitPrice: 1450, expectedDate: today() }],
    });
    await decidePurchaseRequest(as("direct_manager"), pr.uuid, { decision: "approved" });
    await reviewPurchaseRequest(as("procurement"), pr.uuid, { stockAvailable: false });
    const order = await orderUnderContract(as("procurement"), pr.uuid, { contractUuid: signed.uuid });
    expect(order).toMatchObject({ status: "pending_approval", subtotal: 2400, contractUuid: signed.uuid, latePenaltyPctPerDay: 0.5 });
    expect(order.quotationUuid).toBeUndefined();
    expect(readStore().PurchaseRequests.find((p) => p.uuid === pr.uuid)?.status).toBe("ordered");
  });
});

describe("modifying a PO (procurement §1, other cases)", () => {
  it("sends a modified PO back through its approval chain and logs the change", async () => {
    const order = po("PO-0003");
    await amendPurchaseOrder(as("procurement"), order.uuid, {
      deliveryDays: order.deliveryDays,
      note: "Quantity reduced",
      lines: order.lines.map((l) => ({ ...l, qty: 2000 })),
    });
    const after = po("PO-0003");
    expect(after).toMatchObject({ status: "pending_approval", approvals: [], subtotal: 13200 });
    expect(after.amendments.at(-1)?.note).toMatch(/Quantity reduced/);
  });

  it("never goes below what has been received, and needs a real change", () => {
    const order = po("PO-0001");
    const receipts = readStore().GoodsReceipts.filter((r) => r.poUuid === order.uuid);
    const below = order.lines.map((l) => ({ ...l, qty: 1 }));
    expect(amendmentBlocker(order, receipts, below, order.deliveryDays)).toMatch(/already been received/);
    expect(amendmentBlocker(order, receipts, order.lines, order.deliveryDays)).toMatch(/Nothing was changed/);
  });
});

describe("returns to the supplier (procurement §1, other cases)", () => {
  it("takes the goods out of stock and sets the debit note off the next invoice", async () => {
    const grn = await receivePo3();
    const order = po("PO-0003");
    const ruh = byCode(readStore().Warehouses, "WH-RUH").uuid;
    const itemUuid = order.lines[0].itemUuid;
    const before = stockBalance(readStore(), itemUuid, ruh);
    const ret = await returnToSupplier(as("warehouse_keeper"), order.uuid, {
      warehouseUuid: ruh,
      itemUuid,
      qty: 100,
      reason: "Damaged reel",
      remedy: "debit_note",
    });
    expect(ret.debitNoteNumber).toMatch(/^DN-\d{4}$/);
    expect(stockBalance(readStore(), itemUuid, ruh)).toBe(before - 100);
    const invoice = await registerSupplierInvoice(as("accountant"), {
      supplierUuid: order.supplierUuid,
      invoiceNumber: "GF-DN-1",
      invoiceDate: today(),
      poUuid: order.uuid,
      grnUuids: [grn.uuid],
      subtotal: 19800,
      vat: 2970,
      total: 22770,
    });
    expect(invoice.debitNotesDeducted).toBe(759);
    expect(invoice.netPayable).toBe(22011);
  });

  it("puts a replacement back into stock and settles the return", async () => {
    await receivePo3();
    const order = po("PO-0003");
    const ruh = byCode(readStore().Warehouses, "WH-RUH").uuid;
    const itemUuid = order.lines[0].itemUuid;
    const ret = await returnToSupplier(as("warehouse_keeper"), order.uuid, {
      warehouseUuid: ruh,
      itemUuid,
      qty: 50,
      reason: "Wrong colour code",
      remedy: "replacement",
    });
    const mid = stockBalance(readStore(), itemUuid, ruh);
    await receiveReplacement(as("warehouse_keeper"), ret.uuid);
    expect(stockBalance(readStore(), itemUuid, ruh)).toBe(mid + 50);
    expect(readStore().SupplierReturns.find((r) => r.uuid === ret.uuid)?.status).toBe("settled");
  });

  it("refuses to return more than the PO delivered", async () => {
    await receivePo3();
    const order = po("PO-0003");
    await expect(
      returnToSupplier(as("warehouse_keeper"), order.uuid, {
        warehouseUuid: byCode(readStore().Warehouses, "WH-RUH").uuid,
        itemUuid: order.lines[0].itemUuid,
        qty: 5000,
        reason: "x",
        remedy: "debit_note",
      }),
    ).rejects.toThrow(/Only 3000/);
  });
});
