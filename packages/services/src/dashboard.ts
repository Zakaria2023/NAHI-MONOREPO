import { nowIso, round2, sumBy } from "utils";
import { readStore } from "../../../db";
import { EntityKind, Operator, StaffRole, staffRoles } from "../../../db/enum";
import { Store } from "../../../db/types";
import { chainState } from "./core/approvals";
import { budgetUsage } from "./budgets";
import { toProjectListItem } from "./projects";
import {
  CASH_CUSTODY_CHAIN,
  EXTRACT_CHAIN,
  ISSUE_CHAIN,
  PAYROLL_CHAIN,
  PR_CHAIN,
  PURCHASE_CHAIN,
  STOCKTAKE_CHAIN,
  STOCK_SUPPLY_CHAIN,
  TRANSFER_CHAIN,
  WRITE_OFF_CHAIN,
} from "./rules/chains";

// THE DASHBOARD: what is waiting on the person looking at it, and the numbers
// management watches. Everything is derived on read.

export type PendingApproval = {
  kind: EntityKind;
  uuid: string;
  number: string;
  title: string;
  /** Approval chains, and the work that is a role's own job (procurement review, finance approval). */
  step: string;
  /** The role the step waits for — shown when the system admin sees every queue. */
  waitingFor: StaffRole;
};

export type DashboardSummary = {
  projects: { operator: Operator; active: number; closed: number }[];
  stageCounts: { label: string; count: number }[];
  receivablesOutstanding: number;
  payablesOutstanding: number;
  openPurchaseOrders: number;
  budgetOverruns: { projectCode: string; category: string; remaining: number }[];
  pendingTotal: number;
};

const pending = (
  store: Store,
  role: StaffRole,
): PendingApproval[] => {
  const items: PendingApproval[] = [];
  const push = (item: Omit<PendingApproval, "waitingFor">) => items.push({ ...item, waitingFor: role });
  for (const pr of store.PurchaseRequests) {
    if (pr.status === "pending_manager" && chainState(PR_CHAIN, pr.approvals).nextRole === role) {
      push({ kind: "purchase_request", uuid: pr.uuid, number: pr.number, title: pr.department, step: "Direct manager approval" });
    }
    if ((pr.status === "in_review" || pr.status === "rfq") && role === "procurement") {
      push({ kind: "purchase_request", uuid: pr.uuid, number: pr.number, title: pr.department, step: pr.status === "rfq" ? "Collect quotations" : "Procurement review" });
    }
    if (pr.status === "stock_approval" && chainState(STOCK_SUPPLY_CHAIN, pr.approvals.slice(PR_CHAIN.length)).nextRole === role) {
      push({ kind: "purchase_request", uuid: pr.uuid, number: pr.number, title: pr.department, step: "Stock supply approval" });
    }
    if (pr.status === "quote_approval" && chainState(PURCHASE_CHAIN, pr.quoteApprovals).nextRole === role) {
      push({ kind: "purchase_request", uuid: pr.uuid, number: pr.number, title: pr.department, step: "Quotation approval" });
    }
  }
  for (const po of store.PurchaseOrders) {
    if (po.status === "pending_approval" && chainState(PURCHASE_CHAIN, po.approvals).nextRole === role) {
      push({ kind: "purchase_order", uuid: po.uuid, number: po.number, title: "Purchase order", step: "PO approval" });
    }
    if (po.status === "approved" && role === "procurement") {
      push({ kind: "purchase_order", uuid: po.uuid, number: po.number, title: "Purchase order", step: "Send to supplier" });
    }
  }
  for (const ir of store.IssueRequests) {
    if (ir.status === "pending_approval" && chainState(ISSUE_CHAIN, ir.approvals).nextRole === role) {
      push({ kind: "issue_request", uuid: ir.uuid, number: ir.number, title: ir.recipient.name, step: "Issue approval" });
    }
    if (ir.status === "approved" && role === "warehouse_keeper") {
      push({ kind: "issue_request", uuid: ir.uuid, number: ir.number, title: ir.recipient.name, step: "Issue the stock" });
    }
  }
  const chained: [EntityKind, { uuid: string; number: string; status: string; approvals: Parameters<typeof chainState>[1] }[], StaffRole[], string][] = [
    ["stock_transfer", store.StockTransfers, TRANSFER_CHAIN, "Transfer approval"],
    ["stocktake", store.Stocktakes, STOCKTAKE_CHAIN, "Stocktake differences"],
    ["write_off", store.WriteOffs, WRITE_OFF_CHAIN, "Write-off approval"],
    ["cash_custody", store.CashCustodies, CASH_CUSTODY_CHAIN, "Cash custody approval"],
  ];
  for (const [kind, rows, chain, step] of chained) {
    for (const row of rows) {
      if (row.status === "pending_approval" && chainState(chain, row.approvals).nextRole === role) {
        push({ kind, uuid: row.uuid, number: row.number, title: step, step });
      }
    }
  }
  for (const ex of store.Extracts) {
    if (["submitted", "engineer_approved", "pm_approved"].includes(ex.status) && chainState(EXTRACT_CHAIN, ex.approvals).nextRole === role) {
      push({ kind: "extract", uuid: ex.uuid, number: ex.number, title: "Subcontractor extract", step: "Extract approval" });
    }
  }
  for (const run of store.PayrollRuns) {
    if (run.status === "draft" && chainState(PAYROLL_CHAIN, run.approvals).nextRole === role) {
      push({ kind: "payroll_run", uuid: run.uuid, number: run.number, title: `Payroll ${run.period}`, step: "Payroll approval" });
    }
  }
  for (const inv of store.SupplierInvoices) {
    if (inv.status === "registered" && role === "finance_manager") {
      push({ kind: "supplier_invoice", uuid: inv.uuid, number: inv.number, title: inv.invoiceNumber, step: "Invoice approval" });
    }
  }
  return items;
};

/**
 * What is waiting for `role`. The system admin is in no chain, so it sees every
 * role's queue at once, each item saying who it waits for.
 */
export const pendingFor = (store: Store, role: StaffRole): PendingApproval[] =>
  role === "system_admin"
    ? staffRoles.filter((r) => r !== "system_admin").flatMap((r) => pending(store, r))
    : pending(store, role);

export const listPendingApprovals = async (role: StaffRole): Promise<PendingApproval[]> =>
  pendingFor(readStore(), role);

export const getDashboardSummary = async (role: StaffRole): Promise<DashboardSummary> => {
  const store = readStore();
  const now = nowIso();
  const items = store.Projects.map((p) => ({ project: p, row: toProjectListItem(store, p, now) }));
  const stageCounts = new Map<string, number>();
  for (const { row } of items.filter((i) => !i.row.closed)) {
    stageCounts.set(row.stageLabel, (stageCounts.get(row.stageLabel) ?? 0) + 1);
  }
  return {
    projects: (["mobily", "stc"] as const).map((operator) => ({
      operator,
      active: items.filter((i) => i.project.operator === operator && !i.row.closed).length,
      closed: items.filter((i) => i.project.operator === operator && i.row.closed).length,
    })),
    stageCounts: [...stageCounts.entries()].map(([label, count]) => ({ label, count })),
    receivablesOutstanding: round2(sumBy(store.CustomerInvoices.filter((i) => !i.paidAt), (i) => i.total)),
    payablesOutstanding: round2(
      sumBy(
        store.SupplierInvoices.filter((i) => i.status === "registered" || i.status === "approved"),
        (i) => i.netPayable - sumBy(i.payments, (p) => p.amount),
      ),
    ),
    openPurchaseOrders: store.PurchaseOrders.filter((p) => ["pending_approval", "approved", "sent", "partially_received"].includes(p.status)).length,
    budgetOverruns: store.Projects.flatMap((p) =>
      budgetUsage(store, p.uuid)
        .filter((l) => l.planned > 0 && l.remaining < 0)
        .map((l) => ({ projectCode: p.code, category: l.category, remaining: l.remaining })),
    ),
    pendingTotal: pendingFor(store, role).length,
  };
};
