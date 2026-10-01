import { beforeEach, describe, expect, it } from "vitest";
import { readStore, resetStore } from "../../../db";
import { StaffRole, closingItems } from "../../../db/enum";
import { Actor } from "./core/actor";
import { closePeriod, listClosingPeriods, tickClosingItem } from "./closing";
import { listPendingApprovals } from "./dashboard";
import { approveSupplierInvoice, recordSupplierPayment, registerSupplierInvoice } from "./payables";
import { createAsBuiltInvoice } from "./receivables";
import { EXTRACT_CHAIN } from "./rules/chains";
import { extractFigures, vatBlocker } from "./rules/finance";
import { decideExtract, getExtract } from "./subcontractors";

const as = (role: StaffRole): Actor => {
  const user = readStore().StaffUsers.find((u) => u.role === role);
  if (!user) {
    throw new Error(`no ${role}`);
  }
  return { uuid: user.uuid, name: user.name, role };
};

const today = () => new Date().toISOString().slice(0, 10);

beforeEach(() => resetStore());

describe("accounts payable", () => {
  it("checks VAT against the net and the total", () => {
    expect(vatBlocker(1000, 150, 1150)).toBeNull();
    expect(vatBlocker(1000, 100, 1100)).toMatch(/15 %/);
    expect(vatBlocker(1000, 150, 1200)).toMatch(/total/);
  });

  it("refuses the same invoice number twice for a supplier", async () => {
    const ap1 = readStore().SupplierInvoices[0];
    await expect(
      registerSupplierInvoice(as("accountant"), {
        supplierUuid: ap1.supplierUuid,
        invoiceNumber: ap1.invoiceNumber.toLowerCase(),
        invoiceDate: today(),
        poUuid: ap1.poUuid,
        grnUuids: ap1.grnUuids,
        subtotal: ap1.subtotal,
        vat: ap1.vat,
        total: ap1.total,
      }),
    ).rejects.toThrow(/already registered/);
  });

  it("refuses an invoice that does not match the receipt (three-way match)", async () => {
    const store = readStore();
    const ap1 = store.SupplierInvoices[0];
    store.SupplierInvoices = [];
    resetStore(store);
    await expect(
      registerSupplierInvoice(as("accountant"), {
        supplierUuid: ap1.supplierUuid,
        invoiceNumber: "NEW-1",
        invoiceDate: today(),
        poUuid: ap1.poUuid,
        grnUuids: ap1.grnUuids,
        subtotal: 10000,
        vat: 1500,
        total: 11500,
      }),
    ).rejects.toThrow(/Three-way match/);
    const invoice = await registerSupplierInvoice(as("accountant"), {
      supplierUuid: ap1.supplierUuid,
      invoiceNumber: "NEW-1",
      invoiceDate: today(),
      poUuid: ap1.poUuid,
      grnUuids: ap1.grnUuids,
      subtotal: ap1.subtotal,
      vat: ap1.vat,
      total: ap1.total,
    });
    expect(invoice.advanceDeducted).toBe(1000);
    expect(invoice.netPayable).toBe(ap1.total - 1000);
  });

  it("pays an approved invoice and closes it when fully paid", async () => {
    const ap1 = readStore().SupplierInvoices[0];
    await approveSupplierInvoice(as("finance_manager"), ap1.uuid);
    await expect(
      recordSupplierPayment(as("accountant"), ap1.uuid, { method: "bank_transfer", reference: "T1", amount: ap1.netPayable + 1, paidAt: today() }),
    ).rejects.toThrow(/outstanding/);
    await recordSupplierPayment(as("accountant"), ap1.uuid, { method: "bank_transfer", reference: "T1", amount: ap1.netPayable, paidAt: today() });
    const paid = readStore().SupplierInvoices[0];
    expect(paid.status).toBe("paid");
    expect(paid.payments[0].noticeSentAt).toBeDefined();
  });
});

describe("subcontractors", () => {
  it("recovers the advance proportionally and deducts retention", () => {
    const sc = readStore().Subcontracts[0];
    const figures = extractFigures(sc, [{ description: "x", unit: "m", qty: 1000, unitRate: 50 }], 0, 500, 0);
    expect(figures).toMatchObject({ gross: 50000, advanceDeduction: 5000, retention: 5000, penalties: 500, net: 39500 });
  });

  it("deducts the materials issued to the subcontractor on the final approval", async () => {
    const ex2 = readStore().Extracts.find((e) => e.number === "EX-0002");
    if (!ex2) {
      throw new Error("no EX-0002");
    }
    for (const role of EXTRACT_CHAIN) {
      await decideExtract(as(role), ex2.uuid, { decision: "approved" });
    }
    const detail = await getExtract(ex2.uuid);
    expect(detail.extract.status).toBe("approved");
    expect(detail.extract.materialsDeduction).toBe(400 * 3.1 + 4 * 1450);
    expect(detail.subcontract.materialsPending).toBe(0);
  });
});

describe("customers", () => {
  it("invoices an STC as-built only once it is approved", async () => {
    const stc2 = readStore().Projects.find((p) => p.code === "STC-002");
    if (!stc2) {
      throw new Error("no STC-002");
    }
    await expect(
      createAsBuiltInvoice(as("accountant"), { projectUuid: stc2.uuid, amount: 1000, submittedAt: today(), paymentTermsDays: 60 }),
    ).rejects.toThrow(/As-Built must be approved/);
  });
});

describe("monthly closing", () => {
  it("cannot tick procurement or custody while documents are open, so the period cannot close", async () => {
    const period = new Date().toISOString().slice(0, 7);
    await expect(tickClosingItem(as("accountant"), { period, item: "procurement_warehouse" })).rejects.toThrow(/pending/);
    await expect(tickClosingItem(as("accountant"), { period, item: "custody" })).rejects.toThrow(/CC-0001/);
    for (const item of closingItems.filter((i) => i !== "procurement_warehouse" && i !== "custody")) {
      await tickClosingItem(as("accountant"), { period, item });
    }
    await expect(closePeriod(as("finance_manager"), period)).rejects.toThrow(/still open/);
    const view = (await listClosingPeriods()).find((p) => p.period === period);
    expect(view?.canClose).toBe(false);
  });
});

describe("dashboard", () => {
  it("puts each waiting step in the inbox of the role it waits for", async () => {
    expect((await listPendingApprovals("direct_manager")).map((p) => p.number)).toContain("PR-0001");
    expect((await listPendingApprovals("procurement")).map((p) => p.number)).toContain("PR-0002");
    expect((await listPendingApprovals("projects_manager")).map((p) => p.number)).not.toContain("PR-0001");
    expect((await listPendingApprovals("finance_manager")).map((p) => p.number)).toContain("AP-0001");
  });
});

describe("system admin inbox", () => {
  it("sees every role's queue, each item naming who it waits for", async () => {
    const all = await listPendingApprovals("system_admin");
    expect(all.find((p) => p.number === "PR-0001")?.waitingFor).toBe("direct_manager");
    expect(all.some((p) => p.waitingFor === "finance_manager")).toBe(true);
  });
});
