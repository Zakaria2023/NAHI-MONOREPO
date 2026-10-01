import { daysUntil, formatMoney, generateUuid, nextDocumentNumber, nowIso, round2, sumBy } from "utils";
import {
  CashCustodyInput,
  ClearanceInput,
  DecisionFormInput,
  SettleCustodyInput,
} from "validators";
import { readStore, transact } from "../../../db";
import { CashCustody, Clearance, Project, Store } from "../../../db/types";
import { Actor } from "./core/actor";
import { logActivity } from "./core/activity";
import { ChainState, chainState, decide } from "./core/approvals";
import { assertRole, findOrThrow } from "./core/lookup";
import { FINANCE_EDITORS, REQUESTERS } from "./core/roles";
import { budgetBlocker } from "./budgets";
import { CASH_CUSTODY_CHAIN } from "./rules/chains";

// CASH CUSTODY (procurement §4) and the employee clearance that depends on it.

export type CashCustodyRow = CashCustody & {
  projectCode: Project["code"];
  awaiting: ChainState["nextRole"];
  /** Days since it was disbursed and still unsettled. */
  openDays: number | null;
};

export type CashCustodyDetail = {
  custody: CashCustody;
  project: Pick<Project, "uuid" | "code" | "name">;
  chain: ChainState;
};

export type EmployeeCustodySummary = {
  employeeName: string;
  openCash: number;
  openCashCount: number;
  assetCount: number;
  clearanceBlockers: string[];
  clearance: Clearance | null;
};

/** Open custody is overdue for settlement after this many days (report: overdue custody). */
export const CUSTODY_SETTLEMENT_DAYS = 30;

/** Who approves an employee's clearance. */
const CLEARANCE_APPROVERS: Actor["role"][] = ["system_admin", "finance_manager", "region_accountant"];

const OPEN_STATUSES: CashCustody["status"][] = ["pending_approval", "approved", "disbursed"];

const log = (store: Store, actor: Actor, custody: CashCustody, action: string, detail?: string) =>
  logActivity(store, {
    actorName: actor.name,
    entity: "cash_custody",
    entityUuid: custody.uuid,
    entityLabel: custody.number,
    action,
    detail,
  });

/** Step 3's rule: no new custody on a project until the employee's old one there is settled. */
export const openCustodyBlocker = (
  store: Store,
  employeeName: string,
  projectUuid: string,
): string | null => {
  const open = store.CashCustodies.find(
    (c) =>
      c.employeeName.toLowerCase() === employeeName.trim().toLowerCase() &&
      c.projectUuid === projectUuid &&
      OPEN_STATUSES.includes(c.status),
  );
  return open
    ? `${employeeName} still has ${open.number} open on this project — settle it before a new custody`
    : null;
};

/** Step 4: clearance waits for every custody — cash and assets — to be settled. */
export const clearanceBlockers = (store: Store, employeeName: string): string[] => {
  const name = employeeName.trim().toLowerCase();
  const cash = store.CashCustodies.filter(
    (c) => c.employeeName.toLowerCase() === name && OPEN_STATUSES.includes(c.status),
  ).map((c) => `Cash custody ${c.number} (${formatMoney(c.amount)}) is not settled`);
  const assets = store.AssetCustodies.filter(
    (c) => c.employeeName.toLowerCase() === name && c.status === "with_employee",
  ).map((c) => `${findOrThrow(store.Items, c.itemUuid, "Item").name} is still in their custody`);
  return [...cash, ...assets];
};

/** Why `actor` cannot disburse or settle custody, or null — finance pays it out and settles it. */
export const custodyFinanceBlocker = (actor: Actor): string | null =>
  FINANCE_EDITORS.includes(actor.role) ? null : "Disbursed and settled by finance — switch to an accountant";

/** Why `actor` cannot approve clearances, or null. */
export const clearanceApproverBlocker = (actor: Actor): string | null =>
  CLEARANCE_APPROVERS.includes(actor.role) ? null : "Clearance is approved by finance or the region accountant";

export const listCashCustodies = async (): Promise<CashCustodyRow[]> => {
  const store = readStore();
  const now = nowIso();
  return [...store.CashCustodies].reverse().map((c) => ({
    ...c,
    projectCode: findOrThrow(store.Projects, c.projectUuid, "Project").code,
    awaiting: c.status === "pending_approval" ? chainState(CASH_CUSTODY_CHAIN, c.approvals).nextRole : null,
    openDays: c.status === "disbursed" && c.disbursedAt ? -daysUntil(c.disbursedAt, now) : null,
  }));
};

export const getCashCustody = async (uuid: string): Promise<CashCustodyDetail> => {
  const store = readStore();
  const custody = findOrThrow(store.CashCustodies, uuid, "Custody");
  const project = findOrThrow(store.Projects, custody.projectUuid, "Project");
  return {
    custody,
    project: { uuid: project.uuid, code: project.code, name: project.name },
    chain: chainState(CASH_CUSTODY_CHAIN, custody.approvals),
  };
};

/** Report: custody statement per employee, with what blocks their clearance. */
export const listEmployeeCustody = async (): Promise<EmployeeCustodySummary[]> => {
  const store = readStore();
  const names = new Set([
    ...store.CashCustodies.map((c) => c.employeeName),
    ...store.AssetCustodies.map((c) => c.employeeName),
    ...store.StaffUsers.map((u) => u.name),
  ]);
  return [...names].sort().map((employeeName) => {
    const open = store.CashCustodies.filter(
      (c) => c.employeeName === employeeName && OPEN_STATUSES.includes(c.status),
    );
    return {
      employeeName,
      openCash: round2(sumBy(open, (c) => c.amount)),
      openCashCount: open.length,
      assetCount: store.AssetCustodies.filter(
        (c) => c.employeeName === employeeName && c.status === "with_employee",
      ).length,
      clearanceBlockers: clearanceBlockers(store, employeeName),
      clearance: store.Clearances.find((c) => c.employeeName === employeeName) ?? null,
    };
  });
};

export const createCashCustody = async (actor: Actor, input: CashCustodyInput): Promise<CashCustody> => {
  assertRole(actor.role, [...REQUESTERS, "region_accountant"], "request cash custody");
  return transact((store) => {
    findOrThrow(store.Projects, input.projectUuid, "Project");
    const blocker = openCustodyBlocker(store, input.employeeName, input.projectUuid);
    if (blocker) {
      throw new Error(blocker);
    }
    const amount = round2(sumBy(input.lines, (l) => l.amount));
    const budget = budgetBlocker(store, input.projectUuid, input.budgetCategory, amount);
    if (budget) {
      throw new Error(budget);
    }
    const custody: CashCustody = {
      uuid: generateUuid(),
      number: nextDocumentNumber("CC", store.CashCustodies.map((c) => c.number)),
      employeeName: input.employeeName.trim(),
      projectUuid: input.projectUuid,
      budgetCategory: input.budgetCategory,
      city: input.city,
      workOrderNo: input.workOrderNo,
      amount,
      lines: input.lines,
      status: "pending_approval",
      approvals: [],
      createdAt: nowIso(),
    };
    store.CashCustodies.push(custody);
    log(store, actor, custody, "Custody requested", `${custody.employeeName} — ${formatMoney(amount)}`);
    return custody;
  });
};

/** Step 1's six approvers. */
export const decideCashCustody = async (actor: Actor, uuid: string, input: DecisionFormInput): Promise<void> =>
  transact((store) => {
    const custody = findOrThrow(store.CashCustodies, uuid, "Custody");
    if (custody.status !== "pending_approval") {
      throw new Error("This custody is not waiting for approval");
    }
    custody.approvals = decide(CASH_CUSTODY_CHAIN, custody.approvals, { actor, ...input });
    const state = chainState(CASH_CUSTODY_CHAIN, custody.approvals);
    if (state.rejected) {
      custody.status = "rejected";
    } else if (state.complete) {
      custody.status = "approved";
    }
    log(store, actor, custody, input.decision === "approved" ? "Approved" : "Rejected", input.note);
  });

/** Steps 2–3: paid out, entered in the employee's ledger, receipt form signed. */
export const disburseCashCustody = async (actor: Actor, uuid: string): Promise<void> => {
  assertRole(actor.role, FINANCE_EDITORS, "disburse custody");
  transact((store) => {
    const custody = findOrThrow(store.CashCustodies, uuid, "Custody");
    if (custody.status !== "approved") {
      throw new Error("Custody is disbursed once fully approved");
    }
    const now = nowIso();
    custody.status = "disbursed";
    custody.disbursedAt = now;
    custody.receiptSignedAt = now;
    log(store, actor, custody, "Disbursed — receipt form signed by the employee", formatMoney(custody.amount));
  });
};

export const settleCashCustody = async (actor: Actor, uuid: string, input: SettleCustodyInput): Promise<void> => {
  assertRole(actor.role, FINANCE_EDITORS, "settle custody");
  transact((store) => {
    const custody = findOrThrow(store.CashCustodies, uuid, "Custody");
    if (custody.status !== "disbursed") {
      throw new Error("Only disbursed custody is settled");
    }
    if (input.spent > custody.amount) {
      throw new Error("Spent cannot exceed the custody amount");
    }
    custody.settlement = {
      spent: round2(input.spent),
      returned: round2(custody.amount - input.spent),
      settledAt: nowIso(),
      by: actor.name,
      note: input.note?.trim() || undefined,
    };
    custody.status = "settled";
    log(store, actor, custody, "Settled", `Spent ${formatMoney(input.spent)}, returned ${formatMoney(custody.settlement.returned)}`);
  });
};

export const approveClearance = async (actor: Actor, input: ClearanceInput): Promise<void> => {
  assertRole(actor.role, CLEARANCE_APPROVERS, "approve clearances");
  transact((store) => {
    const blockers = clearanceBlockers(store, input.employeeName);
    if (blockers.length > 0) {
      throw new Error(`Clearance refused: ${blockers.join("; ")}`);
    }
    const clearance: Clearance = {
      uuid: generateUuid(),
      employeeName: input.employeeName.trim(),
      reason: input.reason,
      approvedAt: nowIso(),
      approvedBy: actor.name,
    };
    store.Clearances.push(clearance);
    logActivity(store, {
      actorName: actor.name,
      entity: "clearance",
      entityUuid: clearance.uuid,
      entityLabel: clearance.employeeName,
      action: "Clearance approved",
      detail: input.reason,
    });
  });
};
