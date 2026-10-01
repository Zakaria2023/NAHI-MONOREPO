import { beforeEach, describe, expect, it } from "vitest";
import { readStore, resetStore } from "../../../db";
import { StaffRole } from "../../../db/enum";
import { Actor } from "./core/actor";
import { stockBalance } from "./core/stock";
import { approveClearance, createCashCustody } from "./custody";
import {
  addQuotation,
  createPurchaseRequest,
  decidePurchaseOrder,
  decidePurchaseRequest,
  decideQuotation,
  decideStockSupply,
  receiveGoods,
  reviewPurchaseRequest,
  sendPurchaseOrder,
  submitQuotationForApproval,
} from "./procurement";
import { PURCHASE_CHAIN, STOCK_SUPPLY_CHAIN, TRANSFER_CHAIN } from "./rules/chains";
import { createSupplier } from "./suppliers";
import { createIssueRequest, createTransfer, decideIssueRequest, decideTransfer, issueStock } from "./warehouse";

const as = (role: StaffRole): Actor => {
  const user = readStore().StaffUsers.find((u) => u.role === role);
  if (!user) {
    throw new Error(`no ${role}`);
  }
  return { uuid: user.uuid, name: user.name, role };
};

const project = (code: string) => {
  const p = readStore().Projects.find((x) => x.code === code);
  if (!p) {
    throw new Error(code);
  }
  return p;
};

const item = (code: string) => {
  const i = readStore().Items.find((x) => x.code === code);
  if (!i) {
    throw new Error(code);
  }
  return i;
};

const warehouse = (code: string) => {
  const w = readStore().Warehouses.find((x) => x.code === code);
  if (!w) {
    throw new Error(code);
  }
  return w;
};

const approve = { decision: "approved" as const };
const today = () => new Date().toISOString().slice(0, 10);

const raise = (qty: number, estUnitPrice: number, code = "MHL-001") =>
  createPurchaseRequest(as("project_manager"), {
    projectUuid: project("MOB-001").uuid,
    department: "Projects",
    budgetCategory: "civil_materials",
    lines: [{ itemUuid: item(code).uuid, qty, estUnitPrice, expectedDate: today() }],
  });

beforeEach(() => resetStore());

describe("purchasing cycle", () => {
  it("refuses a PR the budget cannot cover at manager approval", async () => {
    const pr = await raise(100, 1450);
    await expect(decidePurchaseRequest(as("direct_manager"), pr.uuid, approve)).rejects.toThrow(/Exceeds the remaining/);
  });

  it("refuses a PR on a project whose budget is not approved", async () => {
    await expect(
      createPurchaseRequest(as("project_manager"), {
        projectUuid: project("MOB-003").uuid,
        department: "Projects",
        budgetCategory: "civil_materials",
        lines: [{ itemUuid: item("MHL-001").uuid, qty: 1, estUnitPrice: 1, expectedDate: today() }],
      }),
    ).rejects.toThrow(/budget must be approved/);
  });

  it("needs three suppliers' quotations, then walks quotation and PO approval to receipt", async () => {
    const pr = await raise(5, 1450);
    await decidePurchaseRequest(as("direct_manager"), pr.uuid, approve);
    await reviewPurchaseRequest(as("procurement"), pr.uuid, { stockAvailable: false });
    const suppliers = readStore().Suppliers;
    const quote = (supplierUuid: string, unitPrice: number) =>
      addQuotation(as("procurement"), pr.uuid, {
        supplierUuid,
        deliveryDays: 7,
        paymentTermsDays: 30,
        qualityScore: 4,
        previouslyApproved: false,
        lines: [{ itemUuid: item("MHL-001").uuid, qty: 5, unitPrice }],
      });
    await quote(suppliers[0].uuid, 1400);
    await quote(suppliers[1].uuid, 1380);
    const twoQuotes = readStore().Quotations.filter((q) => q.prUuid === pr.uuid);
    await expect(
      submitQuotationForApproval(as("procurement"), pr.uuid, { quotationUuid: twoQuotes[1].uuid }),
    ).rejects.toThrow(/at least 3 suppliers/);
    await quote(suppliers[2].uuid, 1420);
    await submitQuotationForApproval(as("procurement"), pr.uuid, { quotationUuid: twoQuotes[1].uuid });
    for (const role of PURCHASE_CHAIN) {
      await decideQuotation(as(role), pr.uuid, approve);
    }
    const po = readStore().PurchaseOrders.find((p) => p.prUuid === pr.uuid);
    if (!po) {
      throw new Error("no PO");
    }
    expect(po).toMatchObject({ subtotal: 6900, vat: 1035, total: 7935, status: "pending_approval" });
    await expect(decidePurchaseOrder(as("procurement"), po.uuid, approve)).rejects.toThrow(/Region project manager/);
    for (const role of PURCHASE_CHAIN) {
      await decidePurchaseOrder(as(role), po.uuid, approve);
    }
    await sendPurchaseOrder(as("procurement"), po.uuid);
    const before = stockBalance(readStore(), item("MHL-001").uuid, warehouse("WH-RUH").uuid);
    await receiveGoods(as("warehouse_keeper"), po.uuid, {
      warehouseUuid: warehouse("WH-RUH").uuid,
      receivedAt: today(),
      lines: [{ itemUuid: item("MHL-001").uuid, receivedQty: 5, acceptedQty: 4, rejectionReason: "Cracked" }],
    });
    expect(stockBalance(readStore(), item("MHL-001").uuid, warehouse("WH-RUH").uuid)).toBe(before + 4);
    expect(readStore().PurchaseOrders.find((p) => p.uuid === po.uuid)?.status).toBe("partially_received");
  });

  it("supplies from stock through its own chain and raises an approved issue request", async () => {
    const pr = await raise(2, 1450);
    await decidePurchaseRequest(as("direct_manager"), pr.uuid, approve);
    await reviewPurchaseRequest(as("procurement"), pr.uuid, { stockAvailable: true });
    for (const role of STOCK_SUPPLY_CHAIN) {
      await decideStockSupply(as(role), pr.uuid, approve);
    }
    expect(readStore().PurchaseRequests.find((p) => p.uuid === pr.uuid)?.status).toBe("fulfilled_from_stock");
    expect(readStore().IssueRequests.at(-1)?.status).toBe("approved");
  });

  it("refuses procurement claiming stock the system does not show", async () => {
    const pr = await createPurchaseRequest(as("project_manager"), {
      projectUuid: project("MOB-001").uuid,
      department: "Projects",
      budgetCategory: "fiber_materials",
      lines: [{ itemUuid: item("ODF-024").uuid, qty: 50, estUnitPrice: 640, expectedDate: today() }],
    });
    await decidePurchaseRequest(as("direct_manager"), pr.uuid, approve);
    await expect(reviewPurchaseRequest(as("procurement"), pr.uuid, { stockAvailable: true })).rejects.toThrow(/must be purchased/);
  });

  it("refuses a duplicate supplier by name or VAT number", async () => {
    const existing = readStore().Suppliers[0];
    const base = { crNumber: "1", address: "a", email: "x@y.sa", phone: "1" };
    await expect(
      createSupplier(as("procurement"), { ...base, name: existing.name.toUpperCase(), vatNumber: "300000000000013" }),
    ).rejects.toThrow(/name/);
    await expect(
      createSupplier(as("procurement"), { ...base, name: "Fresh Co", vatNumber: existing.vatNumber }),
    ).rejects.toThrow(/VAT/);
  });
});

describe("warehouse and custody", () => {
  it("issues a fixed asset as custody on the employee, which then blocks clearance", async () => {
    const ir = readStore().IssueRequests.find((r) => r.number === "IR-0001");
    if (!ir) {
      throw new Error("no IR-0001");
    }
    await decideIssueRequest(as("region_project_manager"), ir.uuid, approve);
    await issueStock(as("warehouse_keeper"), ir.uuid, { signedByRecipient: ir.recipient.name });
    expect(readStore().AssetCustodies.some((c) => c.issueRequestUuid === ir.uuid)).toBe(true);
    await expect(
      approveClearance(as("finance_manager"), { employeeName: ir.recipient.name, reason: "transfer" }),
    ).rejects.toThrow(/still in their custody/);
  });

  it("refuses a fixed asset issued to a subcontractor", async () => {
    await expect(
      createIssueRequest(as("project_manager"), {
        projectUuid: project("MOB-001").uuid,
        warehouseUuid: warehouse("WH-RUH").uuid,
        recipientKind: "cost_center",
        recipientName: "CC-1",
        lines: [{ itemUuid: item("EQP-SPL").uuid, qty: 1 }],
      }),
    ).rejects.toThrow(/employee/);
  });

  it("moves the balance only on the transfer's last approval", async () => {
    const lines = [{ itemUuid: item("FIB-048").uuid, qty: 1000 }];
    const t = await createTransfer(as("warehouse_keeper"), {
      fromWarehouseUuid: warehouse("WH-RUH").uuid,
      toWarehouseUuid: warehouse("WH-DMM").uuid,
      lines,
    });
    for (const role of TRANSFER_CHAIN.slice(0, -1)) {
      await decideTransfer(as(role), t.uuid, approve);
    }
    expect(stockBalance(readStore(), item("FIB-048").uuid, warehouse("WH-DMM").uuid)).toBe(0);
    await decideTransfer(as("operations_manager"), t.uuid, approve);
    expect(stockBalance(readStore(), item("FIB-048").uuid, warehouse("WH-DMM").uuid)).toBe(1000);
  });

  it("refuses new cash custody on a project until the old one is settled", async () => {
    await expect(
      createCashCustody(as("project_manager"), {
        employeeName: as("project_manager").name,
        projectUuid: project("MOB-001").uuid,
        budgetCategory: "overhead",
        city: "Riyadh",
        workOrderNo: "WO-1",
        lines: [{ description: "Fuel", amount: 100 }],
      }),
    ).rejects.toThrow(/CC-0001 open/);
  });
});
