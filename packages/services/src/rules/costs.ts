import { round2 } from "utils";
import { BudgetCategory, ExpenseCategory } from "../../../../db/enum";
import { BudgetStudyLine, OverheadAllocation, Store } from "../../../../db/types";

// COST CONTROL RULES (finance §4: the study, the controls, overhead).

export type Variance = {
  planned: number;
  actual: number;
  /** Planned − actual: negative means over the plan. */
  variance: number;
  /** Actual ÷ planned; null when nothing was planned. */
  usedRatio: number | null;
};

/** A vehicle expense is charged to exactly this many cost centres. */
export const VEHICLE_COST_CENTRES = 2;

export const studyLineAmount = (line: Pick<BudgetStudyLine, "qty" | "unitCost" | "duration">): number =>
  round2(line.qty * line.unitCost * (line.duration && line.duration > 0 ? line.duration : 1));

/** The study summed by budget category — what "apply the study" writes as the planned lines. */
export const studyTotals = (lines: BudgetStudyLine[]): Partial<Record<BudgetCategory, number>> => {
  const totals: Partial<Record<BudgetCategory, number>> = {};
  for (const line of lines) {
    totals[line.category] = round2((totals[line.category] ?? 0) + studyLineAmount(line));
  }
  return totals;
};

export const varianceOf = (planned: number, actual: number): Variance => ({
  planned: round2(planned),
  actual: round2(actual),
  variance: round2(planned - actual),
  usedRatio: planned > 0 ? actual / planned : null,
});

/**
 * Controls: no manual expense without a cost centre; a vehicle expense over
 * exactly two; the shares add up to the amount, each above zero, no centre twice.
 */
export const expenseBlocker = (
  category: ExpenseCategory,
  amount: number,
  allocations: { costCenterUuid: string; amount: number }[],
): string | null => {
  if (allocations.length === 0) {
    return "A manual expense cannot be recorded without a cost centre";
  }
  if (category === "vehicle" && allocations.length !== VEHICLE_COST_CENTRES) {
    return `A vehicle expense is charged to exactly ${VEHICLE_COST_CENTRES} cost centres`;
  }
  if (new Set(allocations.map((a) => a.costCenterUuid)).size !== allocations.length) {
    return "Each cost centre appears once";
  }
  if (allocations.some((a) => a.amount <= 0)) {
    return "Every cost centre's share must be above zero";
  }
  const total = round2(allocations.reduce((sum, a) => sum + a.amount, 0));
  if (Math.abs(total - round2(amount)) > 0.01) {
    return `The shares add up to ${total.toFixed(2)}, not the expense's ${amount.toFixed(2)}`;
  }
  return null;
};

/**
 * Splits the pool in proportion to each project's basis value. Projects with
 * nothing on the basis get nothing; the rounding remainder goes to the last share.
 */
export const overheadShares = (
  pool: number,
  basis: { projectUuid: string; value: number }[],
): { projectUuid: string; basisValue: number; amount: number }[] => {
  const used = basis.filter((b) => b.value > 0);
  const total = used.reduce((sum, b) => sum + b.value, 0);
  if (total <= 0 || pool <= 0) {
    return [];
  }
  let left = round2(pool);
  return used.map((b, index) => {
    const amount = index === used.length - 1 ? left : round2((pool * b.value) / total);
    left = round2(left - amount);
    return { projectUuid: b.projectUuid, basisValue: round2(b.value), amount };
  });
};

/**
 * The month's overhead pool: manual expenses charged to departments and
 * vehicles, the head-office share of approved payroll, and the posted
 * depreciation of assets not charged to a project.
 */
export const overheadPool = (store: Store, period: string): OverheadAllocation["poolParts"] => {
  const projects = new Set(store.Projects.map((p) => p.uuid));
  const expenses = store.Expenses.filter((e) => e.date.slice(0, 7) === period)
    .flatMap((e) => e.allocations)
    .reduce((sum, a) => sum + (projects.has(a.costCenterUuid) ? 0 : a.amount), 0);
  const payroll = store.PayrollRuns.filter((r) => r.period === period && (r.status === "approved" || r.status === "paid"))
    .flatMap((r) => r.payslips.flatMap((p) => p.costAllocations))
    .reduce((sum, a) => sum + (a.projectUuid ? 0 : a.amount), 0);
  const depreciation = store.DepreciationRuns.filter((r) => r.period === period)
    .flatMap((r) => r.lines)
    .reduce((sum, l) => sum + (store.FixedAssets.find((a) => a.uuid === l.assetUuid)?.projectUuid ? 0 : l.amount), 0);
  return { expenses: round2(expenses), payroll: round2(payroll), depreciation: round2(depreciation) };
};
