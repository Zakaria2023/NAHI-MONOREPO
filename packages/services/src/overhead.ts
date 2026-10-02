import { formatMoney, generateUuid, nowIso, round2, sumBy } from "utils";
import { OverheadPostingInput } from "validators";
import { readStore, transact } from "../../../db";
import { OverheadBasis } from "../../../db/enum";
import { OVERHEAD_BASIS_LABELS } from "../../../db/label";
import { OverheadAllocation, Project, Store } from "../../../db/types";
import { Actor } from "./core/actor";
import { logActivity } from "./core/activity";
import { assertRole } from "./core/lookup";
import { FINANCE_EDITORS } from "./core/roles";
import { budgetUsage } from "./budgets";
import { overheadPool, overheadShares } from "./rules/costs";

// OVERHEAD ALLOCATION (finance §4): each month the head office's costs — manual
// expenses charged to departments and vehicles, the head-office share of the
// payroll, the depreciation of assets not charged to a project — are spread over
// the projects on a chosen basis, and each share counts against the project's
// overhead budget.
//
// Bases (assumption, see docs/finance.md): revenue invoiced to date, direct
// cost to date (everything but overhead), or equal shares — over the projects
// whose budget is approved.

export type OverheadPreview = {
  period: string;
  basis: OverheadBasis;
  poolParts: OverheadAllocation["poolParts"];
  pool: number;
  lines: (OverheadAllocation["lines"][number] & { projectCode: Project["code"]; projectName: Project["name"] })[];
  posted: Pick<OverheadAllocation, "basis" | "postedAt" | "postedBy"> | null;
};

const basisValues = (store: Store, basis: OverheadBasis): { projectUuid: string; value: number }[] =>
  store.ProjectBudgets.filter((b) => b.status === "approved").map((b) => ({
    projectUuid: b.projectUuid,
    value:
      basis === "equal"
        ? 1
        : basis === "revenue"
          ? sumBy(store.CustomerInvoices.filter((i) => i.projectUuid === b.projectUuid), (i) => i.amount)
          : sumBy(
              budgetUsage(store, b.projectUuid).filter((l) => l.category !== "overhead"),
              (l) => l.actual,
            ),
  }));

const preview = (store: Store, period: string, basis: OverheadBasis): OverheadPreview => {
  const posted = store.OverheadAllocations.find((o) => o.period === period);
  const poolParts = posted?.poolParts ?? overheadPool(store, period);
  const pool = round2(poolParts.expenses + poolParts.payroll + poolParts.depreciation);
  const lines = posted?.lines ?? overheadShares(pool, basisValues(store, basis));
  return {
    period,
    basis: posted?.basis ?? basis,
    poolParts,
    pool,
    lines: lines.map((l) => {
      const project = store.Projects.find((p) => p.uuid === l.projectUuid);
      return { ...l, projectCode: project?.code ?? "?", projectName: project?.name ?? "" };
    }),
    posted: posted ? { basis: posted.basis, postedAt: posted.postedAt, postedBy: posted.postedBy } : null,
  };
};

export const previewOverhead = async (period: string, basis: OverheadBasis): Promise<OverheadPreview> =>
  preview(readStore(), period, basis);

export const listOverheadAllocations = async (): Promise<OverheadAllocation[]> =>
  [...readStore().OverheadAllocations].sort((a, b) => b.period.localeCompare(a.period));

/** Posts a month's allocation once; each project's share then counts against its overhead budget. */
export const postOverheadAllocation = async (actor: Actor, input: OverheadPostingInput): Promise<OverheadAllocation> => {
  assertRole(actor.role, FINANCE_EDITORS, "allocate overhead");
  return transact((store) => {
    if (input.period > nowIso().slice(0, 7)) {
      throw new Error("Overhead is allocated for the current month or an earlier one");
    }
    if (store.OverheadAllocations.some((o) => o.period === input.period)) {
      throw new Error(`Overhead for ${input.period} is already allocated`);
    }
    const view = preview(store, input.period, input.basis);
    if (view.lines.length === 0) {
      throw new Error(view.pool <= 0 ? "There is no overhead to allocate this month" : "No project has anything on this basis");
    }
    const allocation: OverheadAllocation = {
      uuid: generateUuid(),
      period: input.period,
      basis: input.basis,
      pool: view.pool,
      poolParts: view.poolParts,
      lines: view.lines.map((l) => ({ projectUuid: l.projectUuid, basisValue: l.basisValue, amount: l.amount })),
      postedBy: actor.name,
      postedAt: nowIso(),
    };
    store.OverheadAllocations.push(allocation);
    logActivity(store, {
      actorName: actor.name,
      entity: "overhead_allocation",
      entityUuid: allocation.uuid,
      entityLabel: allocation.period,
      action: "Overhead allocated",
      detail: `${formatMoney(allocation.pool)} over ${allocation.lines.length} projects by ${OVERHEAD_BASIS_LABELS[input.basis].toLowerCase()}`,
    });
    return allocation;
  });
};
