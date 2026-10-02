import { beforeEach, describe, expect, it } from "vitest";
import { readStore, resetStore } from "../../../db";
import { StaffRole } from "../../../db/enum";
import { applyStudyToBudget, getBudgetStudy } from "./budget-study";
import { budgetUsage } from "./budgets";
import { Actor } from "./core/actor";
import { recordExpense } from "./expenses";
import { postOverheadAllocation, previewOverhead } from "./overhead";
import { expenseBlocker, overheadShares, studyLineAmount } from "./rules/costs";

const as = (role: StaffRole): Actor => {
  const user = readStore().StaffUsers.find((u) => u.role === role);
  if (!user) {
    throw new Error(`no ${role}`);
  }
  return { uuid: user.uuid, name: user.name, role };
};

const projectUuid = (code: string) => readStore().Projects.find((p) => p.code === code)?.uuid ?? "";
const centreUuid = (code: string) => readStore().CostCenters.find((c) => c.code === code)?.uuid ?? "";
const today = () => new Date().toISOString().slice(0, 10);
const spentOn = (code: string, category: string) =>
  budgetUsage(readStore(), projectUuid(code)).find((l) => l.category === category)?.spent ?? 0;

beforeEach(() => resetStore());

describe("controls (finance §4)", () => {
  it("refuses a manual expense without a cost centre", () => {
    expect(expenseBlocker("office", 100, [])).toMatch(/without a cost centre/);
  });

  it("charges a vehicle expense to exactly two cost centres", () => {
    expect(expenseBlocker("vehicle", 100, [{ costCenterUuid: "a", amount: 100 }])).toMatch(/exactly 2/);
    expect(expenseBlocker("vehicle", 100, [{ costCenterUuid: "a", amount: 60 }, { costCenterUuid: "b", amount: 40 }])).toBeNull();
  });

  it("needs the shares to add up to the expense", () => {
    expect(expenseBlocker("fuel", 100, [{ costCenterUuid: "a", amount: 90 }])).toMatch(/add up/);
  });

  it("counts a share charged to a project against its budget", async () => {
    const before = spentOn("MOB-001", "equipment");
    await recordExpense(as("accountant"), {
      date: today(),
      description: "Generator hire",
      category: "other",
      budgetCategory: "equipment",
      amount: 1000,
      vat: 150,
      allocations: [
        { costCenterUuid: projectUuid("MOB-001"), amount: 700 },
        { costCenterUuid: centreUuid("HO-ADM"), amount: 300 },
      ],
    });
    expect(spentOn("MOB-001", "equipment")).toBe(before + 700);
  });
});

describe("the budget study (finance §4)", () => {
  it("prices a line as qty × unit cost × duration", () => {
    expect(studyLineAmount({ qty: 2, unitCost: 4000, duration: 3 })).toBe(24000);
    expect(studyLineAmount({ qty: 16, unitCost: 3000 })).toBe(48000);
  });

  it("matches MOB-001's approved budget, and rewrites MOB-003's draft when applied", async () => {
    expect((await getBudgetStudy(projectUuid("MOB-001"))).differsFromBudget).toBe(false);
    const draft = await getBudgetStudy(projectUuid("MOB-003"));
    expect(draft.differsFromBudget).toBe(true);
    await applyStudyToBudget(as("project_manager"), projectUuid("MOB-003"), {});
    const after = await getBudgetStudy(projectUuid("MOB-003"));
    expect(after.differsFromBudget).toBe(false);
    expect(after.categories.find((c) => c.category === "equipment")?.budgeted).toBe(12000);
  });

  it("changes an approved budget only through the budget editors, as a logged revision", async () => {
    await expect(applyStudyToBudget(as("project_manager"), projectUuid("MOB-001"), {})).rejects.toThrow(/projects manager or the finance manager/);
  });
});

describe("overhead allocation (finance §4)", () => {
  it("splits the pool in proportion and gives the remainder to the last share", () => {
    expect(overheadShares(100, [{ projectUuid: "a", value: 1 }, { projectUuid: "b", value: 2 }])).toEqual([
      { projectUuid: "a", basisValue: 1, amount: 33.33 },
      { projectUuid: "b", basisValue: 2, amount: 66.67 },
    ]);
    expect(overheadShares(100, [{ projectUuid: "a", value: 0 }])).toEqual([]);
  });

  it("allocates a month once and books each share against the project's overhead", async () => {
    const lastMonth = readStore().PayrollRuns.find((r) => r.status === "draft")?.period ?? "";
    const preview = await previewOverhead(lastMonth, "direct_cost");
    expect(preview.pool).toBeGreaterThan(0);
    const mob1Share = preview.lines.find((l) => l.projectCode === "MOB-001")?.amount ?? 0;
    const before = spentOn("MOB-001", "overhead");
    await postOverheadAllocation(as("accountant"), { period: lastMonth, basis: "direct_cost" });
    expect(spentOn("MOB-001", "overhead")).toBeCloseTo(before + mob1Share, 2);
    await expect(postOverheadAllocation(as("accountant"), { period: lastMonth, basis: "equal" })).rejects.toThrow(/already allocated/);
  });
});
