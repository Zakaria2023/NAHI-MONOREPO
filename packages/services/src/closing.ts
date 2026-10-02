import { generateUuid, nowIso } from "utils";
import { ClosingTickInput } from "validators";
import { readStore, transact } from "../../../db";
import { ClosingItem, closingItems } from "../../../db/enum";
import { CLOSING_ITEM_LABELS } from "../../../db/label";
import { ClosingPeriod, Store } from "../../../db/types";
import { Actor } from "./core/actor";
import { logActivity } from "./core/activity";
import { assertRole } from "./core/lookup";

// MONTHLY CLOSING (finance §5): a period closes only when every checklist item
// is ticked, and some can only be ticked when the system agrees — nothing open
// in procurement/warehouse or custody, the month's payroll paid, its
// depreciation posted.

export type ClosingItemView = {
  item: ClosingItem;
  done: ClosingPeriod["items"][ClosingItem];
  /** Why the system will not let it be ticked yet; null when it can be. */
  blocker: string | null;
};

export type ClosingView = {
  period: string;
  closedAt?: string;
  closedBy?: string;
  items: ClosingItemView[];
  canClose: boolean;
};

const CLOSING_ROLES = ["accountant", "finance_manager", "system_admin"] as const;

const pendingDocuments = (store: Store): string[] => [
  ...store.PurchaseRequests.filter((p) => ["pending_manager", "in_review", "stock_approval", "quote_approval"].includes(p.status)).map((p) => p.number),
  ...store.PurchaseOrders.filter((p) => p.status === "pending_approval").map((p) => p.number),
  ...store.IssueRequests.filter((r) => r.status === "pending_approval" || r.status === "approved").map((r) => r.number),
  ...store.StockTransfers.filter((t) => t.status === "pending_approval").map((t) => t.number),
  ...store.Stocktakes.filter((s) => s.status === "pending_approval").map((s) => s.number),
  ...store.WriteOffs.filter((w) => w.status === "pending_approval").map((w) => w.number),
  ...store.SupplierInvoices.filter((i) => i.status === "registered").map((i) => i.number),
];

const itemBlocker = (store: Store, item: ClosingItem, period: string): string | null => {
  if (item === "payroll") {
    const run = store.PayrollRuns.find((r) => r.period === period);
    return run?.status === "paid" ? null : `The payroll for ${period} is ${run ? run.status : "not run"} — pay it first`;
  }
  if (item === "depreciation") {
    return store.DepreciationRuns.some((r) => r.period === period) ? null : `Depreciation for ${period} is not posted yet`;
  }
  if (item === "procurement_warehouse") {
    const pending = pendingDocuments(store);
    return pending.length > 0 ? `${pending.length} document(s) still pending: ${pending.slice(0, 6).join(", ")}${pending.length > 6 ? "…" : ""}` : null;
  }
  if (item === "custody") {
    const open = store.CashCustodies.filter((c) => c.status === "disbursed").map((c) => c.number);
    return open.length > 0 ? `Custody not settled: ${open.join(", ")}` : null;
  }
  return null;
};

const view = (store: Store, period: string): ClosingView => {
  const row = store.ClosingPeriods.find((p) => p.period === period);
  const items = closingItems.map((item) => ({
    item,
    done: row?.items[item],
    blocker: itemBlocker(store, item, period),
  }));
  return {
    period,
    closedAt: row?.closedAt,
    closedBy: row?.closedBy,
    items,
    canClose: !row?.closedAt && items.every((i) => i.done),
  };
};

export const listClosingPeriods = async (): Promise<ClosingView[]> => {
  const store = readStore();
  const current = nowIso().slice(0, 7);
  const periods = new Set([current, ...store.ClosingPeriods.map((p) => p.period)]);
  return [...periods].sort((a, b) => b.localeCompare(a)).map((period) => view(store, period));
};

export const tickClosingItem = async (actor: Actor, input: ClosingTickInput): Promise<void> => {
  assertRole(actor.role, [...CLOSING_ROLES], "work the closing checklist");
  transact((store) => {
    let row = store.ClosingPeriods.find((p) => p.period === input.period);
    if (!row) {
      row = { uuid: generateUuid(), period: input.period, items: {} };
      store.ClosingPeriods.push(row);
    }
    if (row.closedAt) {
      throw new Error("The period is closed");
    }
    if (row.items[input.item]) {
      throw new Error("Already ticked");
    }
    const blocker = itemBlocker(store, input.item, input.period);
    if (blocker) {
      throw new Error(blocker);
    }
    row.items[input.item] = { at: nowIso(), by: actor.name };
    logActivity(store, {
      actorName: actor.name,
      entity: "closing",
      entityUuid: row.uuid,
      entityLabel: row.period,
      action: "Checklist item done",
      detail: CLOSING_ITEM_LABELS[input.item],
    });
  });
};

export const closePeriod = async (actor: Actor, period: string): Promise<void> => {
  assertRole(actor.role, ["finance_manager"], "close a period");
  transact((store) => {
    const row = store.ClosingPeriods.find((p) => p.period === period);
    const missing = closingItems.filter((item) => !row?.items[item]);
    if (!row || missing.length > 0) {
      throw new Error(`Not closed — still open: ${missing.map((i) => CLOSING_ITEM_LABELS[i]).join("; ")}`);
    }
    if (row.closedAt) {
      throw new Error("The period is already closed");
    }
    row.closedAt = nowIso();
    row.closedBy = actor.name;
    logActivity(store, {
      actorName: actor.name,
      entity: "closing",
      entityUuid: row.uuid,
      entityLabel: row.period,
      action: "Period closed",
    });
  });
};
