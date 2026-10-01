import { describe, expect, it } from "vitest";
import { readStore, resetStore, transact } from "./index";
import { buildSeed } from "./seed";
import { staffRoles } from "./enum";

describe("seed", () => {
  const store = buildSeed("2026-10-01T09:00:00.000Z");
  const has = <T extends { uuid: string }>(rows: T[], uuid: string | undefined) =>
    rows.some((row) => row.uuid === uuid);

  it("has a staff user for every role, so every approval chain can be walked", () => {
    expect(staffRoles.every((role) => store.StaffUsers.some((u) => u.role === role))).toBe(true);
  });

  it("points every reference at a row that exists", () => {
    const projects = store.Projects;
    expect(store.PurchaseRequests.every((pr) => has(projects, pr.projectUuid))).toBe(true);
    expect(store.Quotations.every((q) => has(store.PurchaseRequests, q.prUuid) && has(store.Suppliers, q.supplierUuid))).toBe(true);
    expect(store.PurchaseOrders.every((po) => has(store.Quotations, po.quotationUuid))).toBe(true);
    expect(store.GoodsReceipts.every((grn) => has(store.PurchaseOrders, grn.poUuid))).toBe(true);
    expect(store.StockMovements.every((m) => has(store.Items, m.itemUuid) && has(store.Warehouses, m.warehouseUuid))).toBe(true);
    expect(store.Subcontracts.every((sc) => has(store.Subcontractors, sc.subcontractorUuid) && has(projects, sc.projectUuid))).toBe(true);
    expect(store.Extracts.every((ex) => has(store.Subcontracts, ex.subcontractUuid))).toBe(true);
    expect(store.ProjectBudgets.every((b) => has(projects, b.projectUuid))).toBe(true);
    expect(store.PortalAccounts.filter((a) => a.kind === "subcontractor").every((a) => has(store.Subcontractors, a.subcontractorUuid))).toBe(true);
  });

  it("gives every project the workflow of its operator", () => {
    expect(store.Projects.every((p) => (p.operator === "mobily" ? p.mobily && !p.stc : p.stc && !p.mobily))).toBe(true);
  });
});

describe("store", () => {
  it("keeps nothing a failed transaction changed", () => {
    resetStore();
    const before = readStore().Projects.length;
    expect(() =>
      transact((store) => {
        store.Projects = [];
        throw new Error("abort");
      }),
    ).toThrow("abort");
    expect(readStore().Projects.length).toBe(before);
  });

  it("hands out copies, so mutating a read changes nothing", () => {
    resetStore();
    readStore().Projects.pop();
    expect(readStore().Projects.length).toBeGreaterThan(0);
    expect(readStore().Projects.length).toBe(buildSeed(new Date().toISOString()).Projects.length);
  });
});
