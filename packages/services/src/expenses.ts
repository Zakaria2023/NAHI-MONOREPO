import { formatMoney, generateUuid, nextDocumentNumber, nowIso, round2, sumBy, toIso } from "utils";
import { CostCenterInput, ExpenseInput } from "validators";
import { readStore, transact } from "../../../db";
import { CostCenterKind } from "../../../db/enum";
import { EXPENSE_CATEGORY_LABELS } from "../../../db/label";
import { CostCenter, Expense, Store } from "../../../db/types";
import { Actor } from "./core/actor";
import { logActivity } from "./core/activity";
import { assertNotFuture, assertRole } from "./core/lookup";
import { FINANCE_EDITORS } from "./core/roles";
import { expenseBlocker } from "./rules/costs";

// COST CENTRES AND MANUAL EXPENSES (finance §4, controls): no manual expense is
// recorded without a cost centre, and a vehicle expense is split over exactly
// two. Every project is a cost centre of its own; departments and vehicles are
// the others. A share charged to a project counts against its budget.

export type CostCenterOption = {
  uuid: string;
  code: string;
  name: string;
  kind: CostCenterKind | "project";
};

export type ExpenseRow = Expense & {
  allocationsView: { code: string; name: string; amount: number }[];
};

export type CostCenterRow = CostCenterOption & {
  /** Manual expenses charged to it, net of VAT. */
  charged: number;
  entries: number;
};

/** Every cost centre: the projects first, then departments and vehicles. */
export const costCenterOptions = (store: Store): CostCenterOption[] => [
  ...store.Projects.map((p) => ({ uuid: p.uuid, code: p.code, name: p.name, kind: "project" as const })),
  ...store.CostCenters.map((c) => ({ uuid: c.uuid, code: c.code, name: c.name, kind: c.kind })),
];

const labelOf = (options: CostCenterOption[], uuid: string) => options.find((o) => o.uuid === uuid);

export const listCostCenters = async (): Promise<CostCenterRow[]> => {
  const store = readStore();
  const allocations = store.Expenses.flatMap((e) => e.allocations);
  // Departments and vehicles first: the projects are many and already listed elsewhere.
  const ordered = [...costCenterOptions(store)].sort((a, b) => Number(a.kind === "project") - Number(b.kind === "project"));
  return ordered.map((c) => {
    const mine = allocations.filter((a) => a.costCenterUuid === c.uuid);
    return { ...c, charged: round2(sumBy(mine, (a) => a.amount)), entries: mine.length };
  });
};

export const listExpenses = async (): Promise<ExpenseRow[]> => {
  const store = readStore();
  const options = costCenterOptions(store);
  return [...store.Expenses]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((e) => ({
      ...e,
      allocationsView: e.allocations.map((a) => {
        const cc = labelOf(options, a.costCenterUuid);
        return { code: cc?.code ?? "?", name: cc?.name ?? "", amount: a.amount };
      }),
    }));
};

export const createCostCenter = async (actor: Actor, input: CostCenterInput): Promise<CostCenter> => {
  assertRole(actor.role, FINANCE_EDITORS, "add cost centres");
  return transact((store) => {
    const code = input.code.trim().toUpperCase();
    if (costCenterOptions(store).some((c) => c.code.toUpperCase() === code)) {
      throw new Error("A cost centre with this code already exists");
    }
    const center: CostCenter = { uuid: generateUuid(), code, name: input.name, kind: input.kind };
    store.CostCenters.push(center);
    logActivity(store, { actorName: actor.name, entity: "cost_center", entityUuid: center.uuid, entityLabel: center.code, action: "Cost centre added", detail: center.name });
    return center;
  });
};

/** A manual expense entry, refused without a cost centre (and a vehicle's without exactly two). */
export const recordExpense = async (actor: Actor, input: ExpenseInput): Promise<Expense> => {
  assertRole(actor.role, FINANCE_EDITORS, "record expenses");
  const date = toIso(input.date);
  assertNotFuture(date);
  return transact((store) => {
    const allocations = input.allocations
      .filter((a) => a.costCenterUuid)
      .map((a) => ({ costCenterUuid: a.costCenterUuid, amount: round2(a.amount) }));
    const blocker = expenseBlocker(input.category, input.amount, allocations);
    if (blocker) {
      throw new Error(blocker);
    }
    const options = costCenterOptions(store);
    if (allocations.some((a) => !labelOf(options, a.costCenterUuid))) {
      throw new Error("Cost centre not found");
    }
    const expense: Expense = {
      uuid: generateUuid(),
      number: nextDocumentNumber("EXP", store.Expenses.map((e) => e.number)),
      date,
      description: input.description,
      category: input.category,
      budgetCategory: input.budgetCategory,
      amount: round2(input.amount),
      vat: round2(input.vat),
      allocations,
      createdBy: actor.name,
      createdAt: nowIso(),
    };
    store.Expenses.push(expense);
    logActivity(store, {
      actorName: actor.name,
      entity: "expense",
      entityUuid: expense.uuid,
      entityLabel: expense.number,
      action: "Expense recorded",
      detail: `${EXPENSE_CATEGORY_LABELS[expense.category]} — ${formatMoney(expense.amount)} over ${allocations.length} cost centre(s)`,
    });
    return expense;
  });
};
