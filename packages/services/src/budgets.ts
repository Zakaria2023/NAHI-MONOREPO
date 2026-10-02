import { generateUuid, nowIso, round2, sumBy } from "utils";
import { readStore, transact } from "../../../db";
import { BudgetCategory, budgetCategories } from "../../../db/enum";
import { BUDGET_CATEGORY_LABELS } from "../../../db/label";
import { BudgetLine, Project, ProjectBudget, Store } from "../../../db/types";
import { Actor } from "./core/actor";
import { logActivity } from "./core/activity";
import { assertRole, findOrThrow } from "./core/lookup";
import { bookedPayrollRuns } from "./payroll";
import { BUDGET_APPROVERS, BUDGET_EDITORS } from "./core/roles";

// PROJECT BUDGET (finance §4). Matched automatically against everything charged
// to the project, so "consumed" and "remaining" are always computed, never kept.
//
//   reserved   — PRs approved by the manager and not yet a PO or a stock issue
//   committed  — POs (net of VAT) that are not cancelled or rejected
//   spent      — cash custody out, approved subcontractor extracts, stock supplied,
//                manual expenses charged to the project, (manpower) the labour
//                cost of approved payroll runs, (overhead) its allocated share
//   remaining  — planned − reserved − committed − spent
//
// The PR approval (procurement step 1) checks against `remaining`.

export type BudgetUsageLine = {
  category: BudgetCategory;
  planned: number;
  reserved: number;
  committed: number;
  spent: number;
  remaining: number;
  /** Invoiced by suppliers plus spent — the cost-to-date figure. */
  actual: number;
};

export type BudgetView = {
  project: Pick<Project, "uuid" | "code" | "name" | "operator" | "poValue">;
  budget: ProjectBudget | null;
  usage: BudgetUsageLine[];
  totals: Omit<BudgetUsageLine, "category">;
};

export type BudgetLinesInput = {
  lines: BudgetLine[];
  reason?: string;
};

const RESERVING_PR_STATUSES = ["in_review", "stock_approval", "rfq", "quote_approval"];

const prEstimate = (lines: { qty: number; estUnitPrice: number }[]): number =>
  round2(sumBy(lines, (line) => line.qty * line.estUnitPrice));

export const budgetUsage = (store: Store, projectUuid: string): BudgetUsageLine[] => {
  const budget = store.ProjectBudgets.find((b) => b.projectUuid === projectUuid);
  return budgetCategories.map((category) => {
    const planned = budget?.lines.find((l) => l.category === category)?.planned ?? 0;
    const prs = store.PurchaseRequests.filter(
      (pr) => pr.projectUuid === projectUuid && pr.budgetCategory === category,
    );
    const reserved = sumBy(
      prs.filter((pr) => RESERVING_PR_STATUSES.includes(pr.status)),
      (pr) => prEstimate(pr.lines),
    );
    const fromStock = sumBy(
      prs.filter((pr) => pr.status === "fulfilled_from_stock"),
      (pr) => prEstimate(pr.lines),
    );
    const pos = store.PurchaseOrders.filter(
      (po) =>
        po.projectUuid === projectUuid &&
        po.budgetCategory === category &&
        po.status !== "cancelled" &&
        po.status !== "rejected",
    );
    const committed = sumBy(pos, (po) => po.subtotal);
    const custody = sumBy(
      store.CashCustodies.filter(
        (c) => c.projectUuid === projectUuid && c.budgetCategory === category,
      ),
      (c) => (c.status === "settled" ? (c.settlement?.spent ?? 0) : c.status === "disbursed" ? c.amount : 0),
    );
    const subcontracts = store.Subcontracts.filter(
      (s) => s.projectUuid === projectUuid && s.budgetCategory === category,
    ).map((s) => s.uuid);
    const extracts = sumBy(
      store.Extracts.filter(
        (e) => subcontracts.includes(e.subcontractUuid) && (e.status === "approved" || e.status === "paid"),
      ),
      (e) => e.gross,
    );
    const invoiced = sumBy(
      store.SupplierInvoices.filter(
        (inv) =>
          (inv.status === "approved" || inv.status === "paid") &&
          pos.some((po) => po.uuid === inv.poUuid),
      ),
      (inv) => inv.subtotal,
    );
    const labour =
      category === "manpower"
        ? sumBy(
            bookedPayrollRuns(store).flatMap((r) => r.payslips.flatMap((p) => p.costAllocations)),
            (a) => (a.projectUuid === projectUuid ? a.amount : 0),
          )
        : 0;
    const expenses = sumBy(
      store.Expenses.filter((e) => e.budgetCategory === category).flatMap((e) => e.allocations),
      (a) => (a.costCenterUuid === projectUuid ? a.amount : 0),
    );
    const overhead =
      category === "overhead"
        ? sumBy(
            store.OverheadAllocations.flatMap((o) => o.lines),
            (l) => (l.projectUuid === projectUuid ? l.amount : 0),
          )
        : 0;
    const spent = round2(custody + extracts + fromStock + labour + expenses + overhead);
    return {
      category,
      planned,
      reserved: round2(reserved),
      committed: round2(committed),
      spent,
      remaining: round2(planned - reserved - committed - spent),
      actual: round2(invoiced + spent),
    };
  });
};

/** Why `amount` cannot be charged to `category`, or null. */
export const budgetBlocker = (
  store: Store,
  projectUuid: string,
  category: BudgetCategory,
  amount: number,
): string | null => {
  const budget = store.ProjectBudgets.find((b) => b.projectUuid === projectUuid);
  if (!budget || budget.status !== "approved") {
    return "The project's budget must be approved before anything is charged to it";
  }
  const line = budgetUsage(store, projectUuid).find((l) => l.category === category);
  const remaining = line?.remaining ?? 0;
  return amount > remaining + 0.005
    ? `Exceeds the remaining ${BUDGET_CATEGORY_LABELS[category]} budget (SAR ${remaining.toLocaleString("en-US")} left)`
    : null;
};

const toView = (store: Store, project: Project): BudgetView => {
  const usage = budgetUsage(store, project.uuid);
  const total = (pick: (l: BudgetUsageLine) => number) => round2(sumBy(usage, pick));
  return {
    project: {
      uuid: project.uuid,
      code: project.code,
      name: project.name,
      operator: project.operator,
      poValue: project.poValue,
    },
    budget: store.ProjectBudgets.find((b) => b.projectUuid === project.uuid) ?? null,
    usage,
    totals: {
      planned: total((l) => l.planned),
      reserved: total((l) => l.reserved),
      committed: total((l) => l.committed),
      spent: total((l) => l.spent),
      remaining: total((l) => l.remaining),
      actual: total((l) => l.actual),
    },
  };
};

export const listBudgets = async (): Promise<BudgetView[]> => {
  const store = readStore();
  return store.Projects.map((project) => toView(store, project));
};

export const getBudget = async (projectUuid: string): Promise<BudgetView> => {
  const store = readStore();
  return toView(store, findOrThrow(store.Projects, projectUuid, "Project"));
};

/**
 * Writes the planned lines. A draft is edited freely by budget editors; an
 * approved budget only with a reason, which is kept with the change.
 */
export const saveBudgetLines = async (
  actor: Actor,
  projectUuid: string,
  input: BudgetLinesInput,
): Promise<void> => {
  assertRole(actor.role, [...BUDGET_EDITORS, "project_manager", "system_admin"], "edit budgets");
  transact((store) => {
    const project = findOrThrow(store.Projects, projectUuid, "Project");
    const existing = store.ProjectBudgets.find((b) => b.projectUuid === projectUuid);
    const lines = input.lines
      .filter((l) => l.planned > 0)
      .map((l) => ({ category: l.category, planned: round2(l.planned) }));
    if (!existing) {
      store.ProjectBudgets.push({
        uuid: generateUuid(),
        projectUuid,
        status: "draft",
        lines,
        revisions: [],
      });
      logActivity(store, { actorName: actor.name, entity: "budget", entityUuid: projectUuid, entityLabel: project.code, action: "Budget drafted" });
      return;
    }
    if (existing.status === "approved") {
      if (!BUDGET_EDITORS.includes(actor.role)) {
        throw new Error("Only the projects manager or the finance manager can change an approved budget");
      }
      if (!input.reason?.trim()) {
        throw new Error("Changing an approved budget needs a reason");
      }
      const changes = budgetCategories
        .map((category) => ({
          category,
          from: existing.lines.find((l) => l.category === category)?.planned ?? 0,
          to: lines.find((l) => l.category === category)?.planned ?? 0,
        }))
        .filter((c) => c.from !== c.to);
      existing.revisions.push({ at: nowIso(), by: actor.name, reason: input.reason.trim(), changes });
      logActivity(store, {
        actorName: actor.name,
        entity: "budget",
        entityUuid: projectUuid,
        entityLabel: project.code,
        action: "Approved budget revised",
        detail: input.reason,
      });
    }
    existing.lines = lines;
  });
};

export const approveBudget = async (actor: Actor, projectUuid: string): Promise<void> => {
  assertRole(actor.role, BUDGET_APPROVERS, "approve budgets");
  transact((store) => {
    const project = findOrThrow(store.Projects, projectUuid, "Project");
    const budget = store.ProjectBudgets.find((b) => b.projectUuid === projectUuid);
    if (!budget || budget.lines.length === 0) {
      throw new Error("Plan at least one budget line first");
    }
    if (budget.status === "approved") {
      throw new Error("The budget is already approved");
    }
    budget.status = "approved";
    budget.approvedAt = nowIso();
    budget.approvedBy = actor.name;
    logActivity(store, { actorName: actor.name, entity: "budget", entityUuid: projectUuid, entityLabel: project.code, action: "Budget approved" });
  });
};
