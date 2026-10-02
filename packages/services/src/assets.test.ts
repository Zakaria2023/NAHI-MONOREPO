import { beforeEach, describe, expect, it } from "vitest";
import { readStore, resetStore } from "../../../db";
import { StaffRole } from "../../../db/enum";
import { countFixedAsset, disposeFixedAsset, postDepreciation, registerFixedAsset, transferFixedAsset } from "./assets";
import { listClosingPeriods, tickClosingItem } from "./closing";
import { Actor } from "./core/actor";
import { accumulatedAt, bookValueAt, chargeFor, depreciationSchedule, disposalGainLoss } from "./rules/assets";

const as = (role: StaffRole): Actor => {
  const user = readStore().StaffUsers.find((u) => u.role === role);
  if (!user) {
    throw new Error(`no ${role}`);
  }
  return { uuid: user.uuid, name: user.name, role };
};

const van = { purchaseDate: "2025-01-15T00:00:00.000Z", cost: 100000, salvageValue: 10000, usefulLifeMonths: 60 };
const thisMonth = () => new Date().toISOString().slice(0, 7);

beforeEach(() => resetStore());

describe("depreciation (finance §7, step 2)", () => {
  it("charges straight-line from the month of purchase", () => {
    expect(chargeFor(van, "2025-01")).toBe(1500);
    expect(accumulatedAt(van, "2025-12")).toBe(18000);
    expect(bookValueAt(van, "2025-12")).toBe(82000);
    expect(chargeFor(van, "2024-12")).toBe(0);
  });

  it("stops at the salvage value when the useful life is over", () => {
    expect(bookValueAt(van, "2029-12")).toBe(10000);
    expect(chargeFor(van, "2030-01")).toBe(0);
    const schedule = depreciationSchedule(van);
    expect(schedule.map((y) => y.year)).toEqual([2025, 2026, 2027, 2028, 2029]);
    expect(schedule.at(-1)?.closing).toBe(10000);
  });

  it("charges a disposed asset nothing after it left the books, and works out the gain or loss", () => {
    const sold = { ...van, disposal: { at: "2026-03-10T00:00:00.000Z" } };
    expect(chargeFor(sold as typeof van, "2026-04")).toBe(0);
    expect(disposalGainLoss(van, "2026-03-10T00:00:00.000Z", 70000)).toEqual({ bookValue: 77500, gainLoss: -7500 });
  });
});

describe("asset cards", () => {
  const input = {
    name: "Test splicer",
    category: "test_equipment" as const,
    serialNumber: "TS-1",
    purchaseDate: "2026-01-01",
    cost: 48000,
    salvageValue: 0,
    usefulLifeMonths: 48,
    projectUuid: "",
    holderKind: "warehouse" as const,
    warehouseUuid: "",
    employeeName: "",
  };

  it("registers, moves, counts once a year, and disposes with the gain or loss", async () => {
    const ruh = readStore().Warehouses[0].uuid;
    const asset = await registerFixedAsset(as("accountant"), { ...input, warehouseUuid: ruh });
    await expect(registerFixedAsset(as("accountant"), { ...input, warehouseUuid: ruh })).rejects.toThrow(/serial number/);
    await transferFixedAsset(as("warehouse_keeper"), asset.uuid, { holderKind: "employee", warehouseUuid: "", employeeName: "Arjun Nair" });
    await countFixedAsset(as("warehouse_keeper"), asset.uuid, { found: true, condition: "Good" });
    await expect(countFixedAsset(as("warehouse_keeper"), asset.uuid, { found: true, condition: "Good" })).rejects.toThrow(/already counted/);
    await disposeFixedAsset(as("finance_manager"), asset.uuid, { kind: "sale", disposedAt: new Date().toISOString().slice(0, 10), proceeds: 50000 });
    const after = readStore().FixedAssets.find((a) => a.uuid === asset.uuid);
    expect(after?.holder.employeeName).toBe("Arjun Nair");
    expect(after?.status).toBe("disposed");
    expect(after?.disposal?.gainLoss).toBeGreaterThan(0);
  });
});

describe("depreciation posting and the closing checklist (finance §5)", () => {
  it("will not tick depreciation until the month is posted, and posts a month once", async () => {
    const period = thisMonth();
    await expect(tickClosingItem(as("accountant"), { period, item: "depreciation" })).rejects.toThrow(/not posted/);
    await postDepreciation(as("accountant"), { period });
    await expect(postDepreciation(as("accountant"), { period })).rejects.toThrow(/already posted/);
    await tickClosingItem(as("accountant"), { period, item: "depreciation" });
    const view = (await listClosingPeriods()).find((p) => p.period === period);
    expect(view?.items.find((i) => i.item === "depreciation")?.done).toBeTruthy();
  });

  it("will not tick payroll until the month's payroll is paid", async () => {
    await expect(tickClosingItem(as("accountant"), { period: thisMonth(), item: "payroll" })).rejects.toThrow(/not run/);
  });
});
